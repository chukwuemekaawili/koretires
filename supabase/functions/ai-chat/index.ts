import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.24.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-id",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  message: string;
  sessionId: string;
  conversationHistory?: ChatMessage[];
  channel?: "web" | "whatsapp" | "voice";
  currentContext?: string; // Add currentContext to interface
}

interface ExtractedEntities {
  tireSize?: string;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  budget?: string;
  name?: string;
  email?: string;
  phone?: string;
  preferredContact?: string;
}

// Input validation constants
const MAX_MESSAGE_LENGTH = 2000;
const MAX_SESSION_ID_LENGTH = 100;
const MAX_HISTORY_LENGTH = 20;
const VALID_CHANNELS = ["web", "whatsapp", "voice"] as const;

// Rate limiting map (in-memory, per-instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 requests per minute per session

// Sanitize string input - remove potential injection patterns
function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";
  // Remove null bytes and control characters except newlines/tabs
  return input
    .replace(/\0/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();
}

// Validate and sanitize the request
function validateRequest(body: unknown): { valid: boolean; error?: string; data?: ChatRequest } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const req = body as Record<string, unknown>;

  // Validate message
  if (!req.message || typeof req.message !== "string") {
    return { valid: false, error: "Message is required and must be a string" };
  }

  const message = sanitizeString(req.message);
  if (message.length === 0) {
    return { valid: false, error: "Message cannot be empty" };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters` };
  }

  // Validate sessionId
  if (!req.sessionId || typeof req.sessionId !== "string") {
    return { valid: false, error: "Session ID is required" };
  }

  const sessionId = sanitizeString(req.sessionId);
  if (sessionId.length === 0 || sessionId.length > MAX_SESSION_ID_LENGTH) {
    return { valid: false, error: "Invalid session ID" };
  }

  // Validate channel
  let channel: "web" | "whatsapp" | "voice" = "web";
  if (req.channel) {
    if (typeof req.channel !== "string" || !VALID_CHANNELS.includes(req.channel as typeof VALID_CHANNELS[number])) {
      return { valid: false, error: "Invalid channel" };
    }
    channel = req.channel as "web" | "whatsapp" | "voice";
  }

  // Validate conversation history
  let conversationHistory: ChatMessage[] = [];
  if (req.conversationHistory) {
    if (!Array.isArray(req.conversationHistory)) {
      return { valid: false, error: "Conversation history must be an array" };
    }
    // Limit history length and validate each message
    conversationHistory = req.conversationHistory
      .slice(-MAX_HISTORY_LENGTH)
      .filter((msg): msg is ChatMessage => {
        if (!msg || typeof msg !== "object") return false;
        const m = msg as Record<string, unknown>;
        return (
          typeof m.role === "string" &&
          ["user", "assistant", "system"].includes(m.role) &&
          typeof m.content === "string" &&
          m.content.length <= MAX_MESSAGE_LENGTH
        );
      })
      .map((msg) => ({
        role: msg.role,
        content: sanitizeString(msg.content).substring(0, MAX_MESSAGE_LENGTH),
      }));
  }

  // Validate currentContext (optional)
  let currentContext: string | undefined = undefined;
  if (req.currentContext && typeof req.currentContext === "string") {
    currentContext = sanitizeString(req.currentContext).substring(0, 500); // Limit context length
  }

  return {
    valid: true,
    data: {
      message,
      sessionId,
      channel,
      conversationHistory,
      currentContext,
    },
  };
}

// Check rate limit
function checkRateLimit(sessionId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(sessionId);

  if (!entry || entry.resetAt < now) {
    // New window
    rateLimitMap.set(sessionId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { allowed: true };
}

// Extract tire size from message
function extractTireSize(message: string): string | undefined {
  // Pattern: 205/55R16, 205/55/16, 205-55-16, etc.
  const sizePattern = /(\d{3})[\/\-](\d{2})[\/\-R]?(\d{2})/i;
  const match = message.match(sizePattern);
  if (match) {
    return `${match[1]}/${match[2]}/${match[3]}`;
  }
  return undefined;
}

// Extract contact info
function extractContactInfo(message: string): Partial<ExtractedEntities> {
  const entities: Partial<ExtractedEntities> = {};

  // Email pattern - basic validation
  const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w{2,}/i);
  if (emailMatch) {
    const email = emailMatch[0].toLowerCase();
    // Basic email validation
    if (email.length <= 254) {
      entities.email = email;
    }
  }

  // Phone pattern (various formats) - validated
  const phoneMatch = message.match(/(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    // Clean and validate phone
    const phone = phoneMatch[0].replace(/[^\d+]/g, "");
    if (phone.length >= 10 && phone.length <= 15) {
      entities.phone = phoneMatch[0];
    }
  }

  return entities;
}

// Detect intent from message
function detectIntent(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("dealer") || lower.includes("wholesale") || lower.includes("bulk order")) {
    return "dealer_inquiry";
  }
  if (lower.includes("fleet") || lower.includes("company vehicle")) {
    return "fleet_inquiry";
  }
  if (lower.includes("book") || lower.includes("appointment") || lower.includes("schedule") || lower.includes("service")) {
    return "booking_request";
  }
  if (lower.includes("quote") || lower.includes("price") || lower.includes("cost") || lower.includes("how much")) {
    return "quote_request";
  }
  if (lower.includes("call") || lower.includes("contact") || lower.includes("reach") || lower.includes("callback")) {
    return "callback_request";
  }
  if (extractTireSize(message) || lower.includes("tire") || lower.includes("find") || lower.includes("recommend") || lower.includes("looking for")) {
    return "tire_search";
  }

  return "general_inquiry";
}

// Check if lead capture should be triggered
function shouldCaptureLead(intent: string, entities: ExtractedEntities): boolean {
  const leadIntents = ["dealer_inquiry", "fleet_inquiry", "booking_request", "quote_request", "callback_request"];
  return leadIntents.includes(intent) || !!(entities.email || entities.phone);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!;

    if (!geminiApiKey) {
      console.error("Missing GEMINI_API_KEY");
      throw new Error("Misconfigured server");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    console.log("VERSION: GEMINI-2.5-FLASH-FINAL - Using model: gemini-2.5-flash");

    // Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validation = validateRequest(requestBody);
    if (!validation.valid || !validation.data) {
      console.error("Validation error:", validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { message, sessionId, conversationHistory, channel, currentContext } = validation.data;

    // Check rate limit
    const rateLimit = checkRateLimit(sessionId);
    if (!rateLimit.allowed) {
      console.warn("Rate limit exceeded for session:", sessionId);
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: "You're sending messages too quickly. Please wait a moment and try again.",
          retryAfter: rateLimit.retryAfter
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(rateLimit.retryAfter || 60)
          }
        }
      );
    }

    console.log("AI chat request received:", { sessionId, channel, messageLength: message.length });

    // Fetch all grounding data in parallel
    const [
      companyInfoResult,
      siteSettingsResult,
      faqEntriesResult,
      serviceCatalogResult,
      policiesResult,
    ] = await Promise.all([
      supabase.from("company_info").select("key, value, category"),
      supabase.from("site_settings").select("key, value"),
      supabase.from("faq_entries").select("question, answer, tags").eq("is_active", true).order("sort_order"),
      supabase.from("service_catalog").select("name, description, price_note").eq("is_active", true).order("sort_order"),
      supabase.from("policies").select("key, title, content").eq("is_active", true),
    ]);

    // Extract tire size from user message for targeted product search
    const requestedTireSize = extractTireSize(message);

    // Fetch products - prioritize by size match and availability
    let productsQuery = supabase
      .from("products")
      .select("id, size, vendor, type, price, availability, description, features")
      .eq("is_active", true);

    if (requestedTireSize) {
      // Validate tire size format before using in query
      const tireSizePattern = /^(\d{3})\/(\d{2})\/(\d{2})$/;
      const match = requestedTireSize.match(tireSizePattern);

      if (match) {
        try {
          const [_, width, aspect, diameter] = match;
          // Search for all 3 parts independently to handle formats like "225/65R17", "225-65-17", etc.
          productsQuery = productsQuery
            .ilike("size", `%${width}%`)
            .ilike("size", `%${aspect}%`)
            .ilike("size", `%${diameter}%`);

          console.log(`Searching for products with size components: ${width}, ${aspect}, ${diameter}`);
        } catch (err) {
          console.error("Error parsing tire size components:", err);
          // Fallback: don't filter by size if parsing fails
        }
      }
    }

    const { data: products } = await productsQuery
      .order("availability", { ascending: true }) // "In Stock" first
      .order("price", { ascending: true })
      .limit(100);

    // Build context from company info
    const companyContext = companyInfoResult.data?.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = {};
      acc[item.category][item.key] = item.value;
      return acc;
    }, {} as Record<string, Record<string, string>>) || {};

    const settingsContext = siteSettingsResult.data?.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, unknown>) || {};

    // Build FAQ context
    const faqContext = faqEntriesResult.data?.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n") || "";

    // Build services context
    const servicesContext = serviceCatalogResult.data?.map(s => `- ${s.name}: ${s.description} (${s.price_note})`).join("\n") || "";

    // Build policies context
    const policiesContext = policiesResult.data?.map(p => `${p.title}: ${p.content}`).join("\n\n") || "";

    // Build product summary
    const productSummary = products?.map(p => ({
      id: p.id,
      size: p.size,
      vendor: p.vendor,
      type: p.type,
      price: p.price,
      availability: p.availability,
      description: p.description,
    })) || [];

    // Get contact info from DB - NO HARDCODED FALLBACKS
    const phone = companyContext.contact?.phone || "(see Contact page)";
    const email = companyContext.contact?.email || "(see Contact page)";
    const whatsapp = companyContext.contact?.whatsapp || "(see Contact page)";
    const address = companyContext.location?.address || "(see Contact page)";
    const city = companyContext.location?.city || "(see Contact page)";

    // Log warning if key info is missing from DB
    if (!companyContext.contact?.phone) {
      console.warn("WARNING: Phone number not found in company_info table");
    }

    let dynamicContext = "";
    if (currentContext) {
      dynamicContext = `\n## CURRENT USER CONTEXT:\n${currentContext}\n\n`;
    }

    const systemPrompt = `You are Kore AI, the friendly and knowledgeable tire expert for Kore Tires in ${city}. You help customers find the right tires, answer questions about services, and guide them through their purchase journey.

## CRITICAL RULES - YOU MUST FOLLOW THESE:
1. ONLY provide information that is explicitly stated in the context below. NEVER invent prices, availability, policies, hours, addresses, or any business details.
2. If you don't have specific information, say "I don't have that specific information" and offer to connect them with staff via phone (${phone}) or WhatsApp.
3. Always be helpful, professional, and concise.
4. When recommending tires, use ONLY the products listed in the AVAILABLE PRODUCTS section.
5. Guide users toward conversion: finding tires, booking services, or connecting with the team.
6. For quotes on shipping outside the local area, always say the cost will be confirmed after order placement - NEVER estimate.
7. Payment is ALWAYS "Pay on Delivery" - cash or card accepted in-person. Online payments are NOT available yet.
${dynamicContext}
## CONTACT INFORMATION (use these exact values):
- Phone: ${phone}
- Email: ${email}
- WhatsApp: ${whatsapp}
- Address: ${address}, ${city}

## STORE HOURS:
- Monday: ${companyContext.hours?.monday || companyContext.hours?.hours_monday || "(see Contact page)"}
- Tuesday: ${companyContext.hours?.tuesday || companyContext.hours?.hours_tuesday || "(see Contact page)"}
- Wednesday: ${companyContext.hours?.wednesday || companyContext.hours?.hours_wednesday || "(see Contact page)"}
- Thursday: ${companyContext.hours?.thursday || companyContext.hours?.hours_thursday || "(see Contact page)"}
- Friday: ${companyContext.hours?.friday || companyContext.hours?.hours_friday || "(see Contact page)"}
- Saturday: ${companyContext.hours?.saturday || companyContext.hours?.hours_saturday || "(see Contact page)"}
- Sunday: ${companyContext.hours?.sunday || companyContext.hours?.hours_sunday || "(see Contact page)"}

## POLICIES:
${policiesContext}

## FAQ (use these for common questions):
${faqContext}

## SERVICES OFFERED:
${servicesContext}

## AVAILABLE PRODUCTS (ONLY recommend from this list):
${JSON.stringify(productSummary, null, 2)}

## GST SETTINGS:
- Rate: ${settingsContext.gst_rate || 5}%

## LEAD CAPTURE:
If the customer is interested in:
- A quote or pricing
- Booking a service appointment
- Dealer/wholesale inquiry
- Fleet services
- Requesting a callback

...ask for their name, phone number, and/or email so our team can follow up. Be natural about it, e.g., "I'd be happy to have our team prepare a quote for you. What's the best phone number to reach you?"

## CONVERSATION GUIDELINES:
1. Greet warmly on first message
2. Ask clarifying questions to understand needs (tire size, vehicle, driving conditions)
3. Recommend specific products from the AVAILABLE PRODUCTS list when appropriate
4. Provide ONLY prices that appear in the data - never estimate or round
5. Mention "In Stock" items first, then "Available within 24h"
6. Always offer to call ${phone} for immediate assistance
7. For bookings, direct to /services page or offer to capture their contact info
8. For tire search, help them by asking for size (format: 205/55/16) or vehicle info

When you don't have enough info to answer, respond with: "I don't have that specific information. Let me connect you with our team - call us at ${phone} or WhatsApp, or I can take your contact info and have someone reach out!"`;

    // Build chat history for Gemini
    const chatHistory = (conversationHistory || []).map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Start chat session with system instruction
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }]
        },
        {
          role: "model",
          parts: [{ text: "Understood. I am Kore AI, ready to assist customers with accurate information from the provided context." }]
        },
        ...chatHistory
      ],
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const assistantMessage = response.text();

    console.log("Gemini response generated details:", { length: assistantMessage.length });

    // Detect intent and extract entities
    const intent = detectIntent(message);
    const contactEntities = extractContactInfo(message);
    const entities: ExtractedEntities = {
      tireSize: requestedTireSize,
      ...contactEntities,
    };

    // Extract any product recommendations from the response
    const recommendedProductDetails = productSummary
      .filter(p => assistantMessage.includes(p.size) || assistantMessage.includes(p.vendor || ""));

    const recommendedProducts = recommendedProductDetails.map(p => p.id);

    // Get or create conversation record
    const { data: existingConvo } = await supabase
      .from("ai_conversations")
      .select("id, messages")
      .eq("session_id", sessionId)
      .single();

    const newMessages = [
      ...(existingConvo?.messages || []),
      { role: "user", content: message, timestamp: new Date().toISOString() },
      { role: "assistant", content: assistantMessage, timestamp: new Date().toISOString() },
    ];

    let conversationId: string;

    if (existingConvo) {
      conversationId = existingConvo.id;
      await supabase
        .from("ai_conversations")
        .update({
          messages: newMessages,
          intent,
          recommended_product_ids: recommendedProducts.length > 0 ? recommendedProducts : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingConvo.id);
    } else {
      const { data: newConvo } = await supabase
        .from("ai_conversations")
        .insert({
          session_id: sessionId,
          channel,
          messages: newMessages,
          intent,
          recommended_product_ids: recommendedProducts.length > 0 ? recommendedProducts : null,
        })
        .select("id")
        .single();

      conversationId = newConvo?.id;
    }

    // Lead capture logic
    let leadCreated = false;
    let leadId: string | null = null;

    if (shouldCaptureLead(intent, entities)) {
      // Check if lead already exists for this conversation
      const { data: existingLead } = await supabase
        .from("ai_leads")
        .select("id")
        .eq("conversation_id", conversationId)
        .single();

      if (existingLead) {
        // Update existing lead with new info
        leadId = existingLead.id;
        await supabase
          .from("ai_leads")
          .update({
            lead_type: intent,
            email: entities.email || undefined,
            phone: entities.phone || undefined,
            tire_size: entities.tireSize || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq("id", leadId);
      } else {
        // Create new lead - truncate message for notes field
        const safeNotes = `Auto-captured from AI chat. User message: "${message.substring(0, 150)}"`;
        const { data: newLead } = await supabase
          .from("ai_leads")
          .insert({
            source_channel: channel,
            conversation_id: conversationId,
            lead_type: intent,
            email: entities.email,
            phone: entities.phone,
            tire_size: entities.tireSize,
            notes: safeNotes,
            metadata: { entities, initialIntent: intent },
          })
          .select("id")
          .single();

        if (newLead) {
          leadId = newLead.id;
          leadCreated = true;

          // Notify admin of new AI chat lead
          if (entities.email || entities.phone) {
            supabase.functions.invoke("send-notification", {
              body: {
                type: "chat_lead",
                recipientEmail: entities.email || companyContext.contact?.email || 'admin@koretires.ca',
                recipientName: entities.name || 'New Chat Lead',
                data: {
                  phone: entities.phone,
                  message: safeNotes,
                  intent: intent,
                  tireSize: entities.tireSize
                },
              },
            }).catch((e) => console.error("Notify error:", e));
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        intent,
        recommendedProducts,
        recommendedProductDetails,
        leadCreated,
        leadId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});