import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  try {
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get pending review requests that are due
    const { data: pendingRequests, error } = await supabase
      .from("review_requests")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_date", new Date().toISOString())
      .limit(50); // Process 50 at a time

    if (error) throw error;

    if (!pendingRequests || pendingRequests.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending review requests to send" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${pendingRequests.length} pending review requests to process`);

    // Send emails via Resend
    const results = [];
    for (const request of pendingRequests) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Kore Tires <noreply@koretires.com>",
            to: request.customer_email,
            subject: "Thank you for your Kore Tires purchase! 🚗",
            html: generateEmailHTML(request.customer_name),
          }),
        });

        const responseData = await emailResponse.json();

        if (emailResponse.ok) {
          // Mark as sent
          await supabase
            .from("review_requests")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", request.id);

          console.log(`✅ Sent review request to ${request.customer_email}`);
          results.push({ email: request.customer_email, status: "sent", id: responseData.id });
        } else {
          // Mark as failed
          await supabase
            .from("review_requests")
            .update({ status: "failed" })
            .eq("id", request.id);

          console.error(`❌ Failed to send to ${request.customer_email}:`, responseData);
          results.push({ email: request.customer_email, status: "failed", error: responseData });
        }
      } catch (err) {
        console.error(`Error processing ${request.customer_email}:`, err);
        results.push({ email: request.customer_email, status: "error", error: err.message });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} review requests`,
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

function generateEmailHTML(customerName: string): string {
  const reviewUrl = "https://search.google.com/local/writereview?placeid=ChIJAwKCRM0hQlMRIkmBYNDQmBw";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px; 
      background-color: #ffffff;
    }
    .header { 
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); 
      color: white; 
      padding: 40px 30px; 
      text-align: center; 
      border-radius: 8px 8px 0 0; 
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content { 
      background: #ffffff; 
      padding: 40px 30px; 
      border-radius: 0 0 8px 8px; 
    }
    .content p {
      margin: 0 0 16px 0;
      font-size: 16px;
    }
    .button { 
      display: inline-block; 
      background: #dc2626; 
      color: #ffffff !important; 
      padding: 16px 32px; 
      text-decoration: none; 
      border-radius: 6px; 
      margin: 24px 0; 
      font-weight: 600;
      font-size: 16px;
    }
    .button:hover {
      background: #991b1b;
    }
    .contact-list {
      list-style: none;
      padding: 0;
      margin: 16px 0;
    }
    .contact-list li {
      margin: 8px 0;
      font-size: 15px;
    }
    .footer { 
      text-align: center; 
      padding: 20px; 
      color: #666; 
      font-size: 13px;
      border-top: 1px solid #e5e5e5;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Thank You, ${customerName}!</h1>
    </div>
    <div class="content">
      <p>Hi ${customerName},</p>
      
      <p>Thanks for choosing Kore Tires for your recent tire purchase! We hope you're enjoying your new tires and experiencing smooth, safe rides.</p>
      
      <p><strong>Would you mind sharing your experience?</strong></p>
      
      <p>Your review helps us improve our service and helps other customers make informed decisions. It only takes a minute!</p>
      
      <center>
        <a href="${reviewUrl}" class="button">Leave a Google Review ⭐</a>
      </center>
      
      <p>We truly appreciate your feedback and your business.</p>
      
      <p>If you have any questions or concerns, please don't hesitate to contact us:</p>
      <ul class="contact-list">
        <li>📞 Phone: 780-455-1251</li>
        <li>📧 Email: edmonton@koretires.com</li>
        <li>📍 11314 163 Street NW, Edmonton, AB T5M 1Y6</li>
      </ul>
      
      <p>Thanks again for choosing Kore Tires!</p>
      
      <p><strong>The Kore Tires Team</strong></p>
    </div>
    <div class="footer">
      <p>You received this email because you recently purchased from Kore Tires.</p>
      <p>© ${new Date().getFullYear()} Kore Tires Sales and Services. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}
