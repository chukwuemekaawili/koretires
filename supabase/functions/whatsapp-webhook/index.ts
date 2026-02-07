import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

/**
 * WhatsApp Webhook Handler - STUB IMPLEMENTATION
 * 
 * This endpoint is "webhook-ready" for Meta WhatsApp Business API integration.
 * Currently logs incoming messages and prepares responses without sending.
 * 
 * TODO: To enable full WhatsApp integration:
 * 1. Register a Meta Business Account
 * 2. Set up WhatsApp Business API
 * 3. Configure webhook URL to point here
 * 4. Add META_WHATSAPP_TOKEN secret
 * 5. Uncomment the sending logic below
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: { body: string };
  type: string;
}

interface WhatsAppWebhookPayload {
  object: string;
  entry?: Array<{
    id: string;
    changes?: Array<{
      value: {
        messaging_product: string;
        metadata: { phone_number_id: string };
        messages?: WhatsAppMessage[];
      };
    }>;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const verifyToken = Deno.env.get("META_WHATSAPP_VERIFY_TOKEN") || "kore_tires_webhook_verify";
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Handle webhook verification (GET request from Meta)
    if (req.method === "GET") {
      const url = new URL(req.url);
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      if (mode === "subscribe" && token === verifyToken) {
        console.log("WhatsApp webhook verified successfully");
        return new Response(challenge, { status: 200 });
      }

      return new Response("Forbidden", { status: 403 });
    }

    // Handle incoming messages (POST request)
    if (req.method === "POST") {
      const payload: WhatsAppWebhookPayload = await req.json();
      
      console.log("WhatsApp webhook received:", JSON.stringify(payload, null, 2));

      // Validate this is a WhatsApp message
      if (payload.object !== "whatsapp_business_account") {
        return new Response("Not a WhatsApp event", { status: 400 });
      }

      // Process each message
      for (const entry of payload.entry || []) {
        for (const change of entry.changes || []) {
          const messages = change.value?.messages || [];
          
          for (const msg of messages) {
            if (msg.type !== "text" || !msg.text?.body) continue;

            const senderPhone = msg.from;
            const messageText = msg.text.body;
            const messageId = msg.id;

            console.log(`WhatsApp message from ${senderPhone}: ${messageText}`);

            // Generate session ID for this phone number
            const sessionId = `whatsapp_${senderPhone}`;

            // Get or create conversation
            const { data: existingConvo } = await supabase
              .from("ai_conversations")
              .select("id, messages")
              .eq("session_id", sessionId)
              .single();

            // Call AI chat function to get response
            const aiResponse = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                message: messageText,
                sessionId,
                channel: "whatsapp",
                conversationHistory: existingConvo?.messages || [],
              }),
            });

            const aiData = await aiResponse.json();
            const replyText = aiData.message || "I'm sorry, I couldn't process your message. Please visit our Contact page for assistance.";

            // Log the outbound reply for future sending
            await supabase.from("audit_log").insert({
              table_name: "whatsapp_outbound",
              action: "reply_prepared",
              new_values: {
                to: senderPhone,
                inbound_message_id: messageId,
                reply_text: replyText,
                intent: aiData.intent,
                lead_created: aiData.leadCreated,
                status: "pending_send", // Would be "sent" when WhatsApp API is connected
              },
            });

            console.log(`WhatsApp reply prepared for ${senderPhone}: ${replyText.substring(0, 100)}...`);

            // TODO: Uncomment when Meta WhatsApp API is configured
            /*
            const metaToken = Deno.env.get("META_WHATSAPP_TOKEN");
            const phoneNumberId = change.value.metadata.phone_number_id;

            if (metaToken && phoneNumberId) {
              await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${metaToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  messaging_product: "whatsapp",
                  to: senderPhone,
                  type: "text",
                  text: { body: replyText },
                }),
              });
            }
            */
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error: unknown) {
    console.error("WhatsApp webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
