import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

// Internal secret for service-to-service calls
const INTERNAL_SECRET = Deno.env.get("INTERNAL_API_SECRET");

interface NotificationRequest {
  type: "order_confirmation" | "booking_received" | "dealer_application" | "subscription_signup" | "invoice_created" | "lead_followup";
  recipientEmail: string;
  recipientName: string;
  data: Record<string, unknown>;
}

// Validation constants
const MAX_EMAIL_LENGTH = 254;
const MAX_NAME_LENGTH = 100;
const VALID_NOTIFICATION_TYPES = [
  "order_confirmation",
  "booking_received",
  "dealer_application",
  "subscription_signup",
  "invoice_created",
  "lead_followup"
] as const;

// HTML escape function to prevent XSS in email templates
function escapeHtml(unsafe: unknown): string {
  if (typeof unsafe !== "string") {
    return String(unsafe ?? "");
  }
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= MAX_EMAIL_LENGTH;
}

// Sanitize and validate string
function sanitizeString(input: unknown, maxLength: number): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/\0/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim()
    .substring(0, maxLength);
}

// Validate request
function validateRequest(body: unknown): { valid: boolean; error?: string; data?: NotificationRequest } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const req = body as Record<string, unknown>;

  // Validate type
  if (!req.type || typeof req.type !== "string") {
    return { valid: false, error: "Notification type is required" };
  }
  if (!VALID_NOTIFICATION_TYPES.includes(req.type as typeof VALID_NOTIFICATION_TYPES[number])) {
    return { valid: false, error: "Invalid notification type" };
  }

  // Validate email
  if (!req.recipientEmail || typeof req.recipientEmail !== "string") {
    return { valid: false, error: "Recipient email is required" };
  }
  const email = sanitizeString(req.recipientEmail, MAX_EMAIL_LENGTH);
  if (!isValidEmail(email)) {
    return { valid: false, error: "Invalid email format" };
  }

  // Validate name
  if (!req.recipientName || typeof req.recipientName !== "string") {
    return { valid: false, error: "Recipient name is required" };
  }
  const name = sanitizeString(req.recipientName, MAX_NAME_LENGTH);
  if (name.length === 0) {
    return { valid: false, error: "Recipient name cannot be empty" };
  }

  // Validate data object
  if (!req.data || typeof req.data !== "object") {
    return { valid: false, error: "Data object is required" };
  }

  return {
    valid: true,
    data: {
      type: req.type as NotificationRequest["type"],
      recipientEmail: email,
      recipientName: name,
      data: req.data as Record<string, unknown>,
    },
  };
}

// Verify the request is authenticated (internal service call or admin)
// deno-lint-ignore no-explicit-any
// deno-lint-ignore no-explicit-any
async function verifyAuth(req: Request, supabase: any, notificationType?: string): Promise<{ authorized: boolean; error?: string }> {
  // Check for internal secret (service-to-service)
  const internalSecret = req.headers.get("x-internal-secret");
  if (INTERNAL_SECRET && internalSecret === INTERNAL_SECRET) {
    return { authorized: true };
  }

  // Public notification types that don't require admin auth
  const PUBLIC_TYPES = [
    "order_confirmation",
    "booking_received",
    "dealer_application",
    "subscription_signup",
    "lead_followup"
  ];

  if (notificationType && PUBLIC_TYPES.includes(notificationType)) {
    return { authorized: true };
  }

  // Check for admin JWT
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { authorized: false, error: "Missing authorization" };
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return { authorized: false, error: "Invalid token" };
    }

    // Check if user is admin/staff
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "staff"]);

    if (!roles || roles.length === 0) {
      return { authorized: false, error: "Insufficient permissions" };
    }

    return { authorized: true };
  } catch {
    return { authorized: false, error: "Authentication error" };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Parse and validate request
    let requestBody: unknown;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check auth with type hint
    const typeHint = (requestBody as any)?.type;
    console.log("Debug: Auth check for type:", typeHint);
    const auth = await verifyAuth(req, supabase, typeHint);

    if (!auth.authorized) {
      console.warn("Unauthorized notification attempt:", auth.error);
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: auth.error, debugType: typeHint }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    const { type, recipientEmail, recipientName, data } = validation.data;

    console.log("Processing notification:", { type, recipientEmail, recipientName: recipientName.substring(0, 20) });

    // Fetch company info for email templates
    const { data: companyInfo } = await supabase
      .from("company_info")
      .select("key, value, category");

    const company = companyInfo?.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = {};
      acc[item.category][item.key] = item.value;
      return acc;
    }, {} as Record<string, Record<string, string>>) || {};

    // Get contact info from DB - NO HARDCODED FALLBACKS
    const phone = company.contact?.phone || "(see Contact page)";
    const contactEmail = company.contact?.email || "(see Contact page)";
    const address = company.location?.address || "(see Contact page)";
    const city = company.location?.city || "";

    // Log warning if key info is missing
    if (!company.contact?.phone || !company.contact?.email) {
      console.warn("WARNING: Company contact info not found in DB - emails may have incomplete info");
    }

    // Helper to safely get and escape data values
    const safeData = (key: string, fallback = ""): string => {
      return escapeHtml(data[key] ?? fallback);
    };

    // Email templates - use company info from DB with HTML escaping
    const emailTemplates: Record<string, () => { subject: string; html: string }> = {
      order_confirmation: () => ({
        subject: `Order Confirmed - ${safeData("orderNumber")}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Thank you for your order!</h1>
            <p>Hi ${escapeHtml(recipientName)},</p>
            <p>Your order <strong>${safeData("orderNumber")}</strong> has been received and is being processed.</p>
            <h2>Order Details</h2>
            <p>Fulfillment: ${safeData("fulfillmentMethod")}</p>
            <p>Total: $${safeData("total")}</p>
            <h2>What's Next?</h2>
            <p>We'll contact you via ${safeData("preferredContact")} to confirm details and schedule your ${safeData("fulfillmentMethod") === "pickup" ? "pickup" : "delivery/service"}.</p>
            <p><strong>Payment:</strong> Pay on ${safeData("fulfillmentMethod") === "pickup" ? "pickup" : "delivery"} - Cash or card accepted in-person.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p>Questions? Call us at <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></p>
            <p><strong>Kore Tires</strong><br>${escapeHtml(address)}, ${escapeHtml(city)}</p>
          </div>
        `,
      }),

      booking_received: () => ({
        subject: `Booking Request Received - ${safeData("serviceType")}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Booking Request Received</h1>
            <p>Hi ${escapeHtml(recipientName)},</p>
            <p>We've received your ${safeData("serviceType")} booking request.</p>
            <h2>Request Details</h2>
            <p>Service: ${safeData("serviceType")}</p>
            <p>Preferred Date: ${safeData("preferredDate")}</p>
            ${data.preferredTime ? `<p>Preferred Time: ${safeData("preferredTime")}</p>` : ""}
            <h2>What's Next?</h2>
            <p>Our team will contact you within 24 hours to confirm your appointment.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p>Need to make changes? Call us at <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></p>
            <p><strong>Kore Tires</strong><br>${escapeHtml(address)}, ${escapeHtml(city)}</p>
          </div>
        `,
      }),

      dealer_application: () => ({
        subject: "Dealer Application Received - Kore Tires",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Dealer Application Received</h1>
            <p>Hi ${escapeHtml(recipientName)},</p>
            <p>Thank you for applying to become a Kore Tires dealer!</p>
            <h2>Application Details</h2>
            <p>Business: ${safeData("businessName")}</p>
            <p>Location: ${safeData("city")}, ${safeData("province")}</p>
            <h2>What's Next?</h2>
            <p>Our team will review your application and contact you within 2-3 business days.</p>
            <p>Once approved, you'll have access to wholesale pricing and dealer portal features.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p>Questions? Contact us at <a href="mailto:${escapeHtml(contactEmail)}">${escapeHtml(contactEmail)}</a></p>
            <p><strong>Kore Tires</strong><br>${escapeHtml(address)}, ${escapeHtml(city)}</p>
          </div>
        `,
      }),

      subscription_signup: () => ({
        subject: `Subscription Request - ${safeData("planName")}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Subscription Request Received</h1>
            <p>Hi ${escapeHtml(recipientName)},</p>
            <p>Thank you for your interest in our ${safeData("planName")} subscription plan!</p>
            <h2>Plan Details</h2>
            <p>Plan: ${safeData("planName")}</p>
            <p>Billing: ${safeData("billingInterval")}</p>
            <h2>What's Next?</h2>
            <p>Our team will contact you to finalize your subscription and schedule your first service.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p>Questions? Call us at <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></p>
            <p><strong>Kore Tires</strong><br>${escapeHtml(address)}, ${escapeHtml(city)}</p>
          </div>
        `,
      }),

      invoice_created: () => ({
        subject: `Invoice ${safeData("invoiceNumber")} - Kore Tires`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Invoice Created</h1>
            <p>Hi ${escapeHtml(recipientName)},</p>
            <p>A new invoice has been created for your recent purchase/service.</p>
            <h2>Invoice Details</h2>
            <p>Invoice #: ${safeData("invoiceNumber")}</p>
            <p>Amount: $${safeData("total")}</p>
            <p>Due Date: ${safeData("dueDate", "Upon receipt")}</p>
            ${data.pdfUrl && typeof data.pdfUrl === "string" && data.pdfUrl.startsWith("https://") ? `<p><a href="${escapeHtml(data.pdfUrl)}" style="color: #2563eb;">Download Invoice PDF</a></p>` : ""}
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p>Questions about this invoice? Call us at <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></p>
            <p><strong>Kore Tires</strong><br>${escapeHtml(address)}, ${escapeHtml(city)}</p>
          </div>
        `,
      }),

      lead_followup: () => ({
        subject: "Following up on your tire inquiry - Kore Tires",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Thanks for reaching out!</h1>
            <p>Hi ${escapeHtml(recipientName)},</p>
            <p>Thank you for your interest in Kore Tires. One of our team members will be in touch shortly to assist you.</p>
            ${data.tireSize ? `<p>Tire size requested: ${safeData("tireSize")}</p>` : ""}
            ${data.inquiryType ? `<p>Inquiry type: ${safeData("inquiryType")}</p>` : ""}
            <p>In the meantime, feel free to browse our selection at <a href="https://koretires.lovable.app/shop" style="color: #2563eb;">koretires.com/shop</a></p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p>Need immediate assistance? Call us at <a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></p>
            <p><strong>Kore Tires</strong><br>${escapeHtml(address)}, ${escapeHtml(city)}</p>
          </div>
        `,
      }),
    };

    // Get email template
    const templateFn = emailTemplates[type];
    if (!templateFn) {
      return new Response(
        JSON.stringify({ error: "Unknown notification type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailContent = templateFn();

    // Always log to notifications table first
    const { data: notification, error: insertError } = await supabase
      .from("notifications")
      .insert({
        type,
        to_email: recipientEmail,
        subject: emailContent.subject,
        status: resendApiKey ? "queued" : "pending_smtp_config",
        payload: { recipientName, data: JSON.stringify(data).substring(0, 10000) },
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to log notification:", insertError);
    }

    // If Resend is not configured, return early
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured. Notification logged:", {
        id: notification?.id,
        to: recipientEmail,
        subject: emailContent.subject,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Notification logged (email sending not configured)",
          notificationId: notification?.id,
          pending: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email with Resend
    try {
      // 1. Send customer email first (priority)
      const customerRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Kore Tires <noreply@koretires.com>",
          to: [recipientEmail],
          subject: emailContent.subject,
          html: emailContent.html,
        }),
      });
      const customerResult = await customerRes.json();
      console.log("Customer email result:", JSON.stringify({ status: customerRes.status, body: customerResult }));

      const customerSent = customerRes.ok;

      // 2. Send admin alert separately (non-blocking)
      let adminResult = null;
      if (type === "order_confirmation" && contactEmail && contactEmail !== "(see Contact page)") {
        try {
          const adminRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Kore Tires System <noreply@koretires.com>",
              to: [contactEmail],
              subject: `[ADMIN] New Order ${safeData("orderNumber")} - $${safeData("total")}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #2563eb;">New Order Received</h1>
                  <p><strong>Order:</strong> ${safeData("orderNumber")}</p>
                  <p><strong>Customer:</strong> ${escapeHtml(recipientName)} (${safeData("recipientPhone") || "No phone"})</p>
                  <p><strong>Email:</strong> ${escapeHtml(recipientEmail)}</p>
                  <p><strong>Total:</strong> $${safeData("total")}</p>
                  <p><strong>Fulfillment:</strong> ${safeData("fulfillmentMethod")}</p>
                  <p><strong>Preferred Contact:</strong> ${safeData("preferredContact")}</p>
                </div>
              `
            }),
          });
          adminResult = await adminRes.json();
          console.log("Admin alert result:", JSON.stringify({ status: adminRes.status, body: adminResult }));
        } catch (adminErr) {
          console.warn("Admin alert failed (non-critical):", adminErr);
        }
      }

      // Update notification status based on customer email
      if (notification?.id) {
        await supabase
          .from("notifications")
          .update({
            status: customerSent ? "sent" : "failed",
            sent_at: customerSent ? new Date().toISOString() : null,
            error: customerSent ? null : JSON.stringify(customerResult),
          })
          .eq("id", notification.id);
      }

      if (!customerSent) {
        return new Response(
          JSON.stringify({ success: false, message: "Customer email failed", error: customerResult, notificationId: notification?.id }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Email(s) sent", notificationId: notification?.id, customerEmail: customerResult, adminAlert: adminResult }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (sendError: unknown) {
      const errorMessage = sendError instanceof Error ? sendError.message : "Unknown error";
      console.error("Resend send error:", errorMessage);

      // Update notification status to failed
      if (notification?.id) {
        await supabase
          .from("notifications")
          .update({ status: "failed", error: errorMessage })
          .eq("id", notification.id);
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: "Email send failed",
          notificationId: notification?.id,
          details: errorMessage,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Notification error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);