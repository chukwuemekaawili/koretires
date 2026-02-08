import { supabase } from "@/integrations/supabase/client";

/**
 * Google Review Automation
 * Sends review requests to customers after order completion
 */

interface ReviewRequest {
  orderId: string;
  customerEmail: string;
  customerName: string;
  orderNumber: string;
}

/**
 * Schedule a Google review request for a customer
 * In a production environment, this would integrate with an email service
 * For now, it creates a record in the database that can be processed by a cron job
 */
export async function scheduleReviewRequest(request: ReviewRequest): Promise<void> {
  try {
    const { error } = await supabase
      .from("review_requests")
      .insert({
        order_id: request.orderId,
        customer_email: request.customerEmail,
        customer_name: request.customerName,
        order_number: request.orderNumber,
        scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        status: "pending",
      });

    if (error) throw error;

    console.log(`Review request scheduled for ${request.customerEmail} (Order: ${request.orderNumber})`);
  } catch (error) {
    console.error("Failed to schedule review request:", error);
    // Don't throw - we don't want order placement to fail if review scheduling fails
  }
}

/**
 * Get the Google Review URL for Kore Tires
 * Direct link to Kore Tires Edmonton Google review page
 */
export function getGoogleReviewUrl(): string {
  const placeId = "ChIJAwKCRM0hQlMRIkmBYNDQmBw"; // Kore Tires Inc, Edmonton
  return `https://search.google.com/local/writereview?placeid=${placeId}`;
}

/**
 * Generate email content for review request
 */
export function generateReviewEmailContent(customerName: string): {
  subject: string;
  html: string;
  text: string;
} {
  const reviewUrl = getGoogleReviewUrl();

  const subject = "Thank you for your Kore Tires purchase! 🚗";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .button:hover { background: #991b1b; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Thank You, ${customerName}!</h1>
        </div>
        <div class="content">
          <p>Hi ${customerName},</p>
          
          <p>Thanks for choosing Kore Tires for your recent tire purchase! We hope you're enjoying your new tires and experiencing smooth, safe rides.</p>
          
          <p><strong>Would you mind sharing your experience?</strong></p>
          
          <p>Your review helps us improve our service and helps other customers make informed decisions. It only takes a minute!</p>
          
          <a href="${reviewUrl}" class="button">Leave a Google Review ⭐</a>
          
          <p>We truly appreciate your feedback and your business.</p>
          
          <p>If you have any questions or concerns, please don't hesitate to contact us at:</p>
          <ul>
            <li>📞 Phone: 780-455-1251</li>
            <li>📧 Email: edmonton@koretires.com</li>
          </ul>
          
          <p>Thanks again for choosing Kore Tires!</p>
          
          <p><strong>The Kore Tires Team</strong><br>
          11314 163 Street NW, Edmonton, AB T5M 1Y6</p>
        </div>
        <div class="footer">
          <p>You received this email because you recently purchased from Kore Tires.</p>
          <p>© ${new Date().getFullYear()} Kore Tires Sales and Services. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hi ${customerName},

Thanks for choosing Kore Tires for your recent tire purchase! We hope you're enjoying your new tires and experiencing smooth, safe rides.

Would you mind sharing your experience?

Your review helps us improve our service and helps other customers make informed decisions. It only takes a minute!

Leave a Google Review: ${reviewUrl}

We truly appreciate your feedback and your business.

If you have any questions or concerns, please contact us:
- Phone: 780-455-1251
- Email: edmonton@koretires.com

Thanks again for choosing Kore Tires!

The Kore Tires Team
11314 163 Street NW, Edmonton, AB T5M 1Y6

---
You received this email because you recently purchased from Kore Tires.
© ${new Date().getFullYear()} Kore Tires Sales and Services. All rights reserved.
  `.trim();

  return { subject, html, text };
}

/**
 * Mark a review request as sent
 */
export async function markReviewRequestSent(requestId: string): Promise<void> {
  await supabase
    .from("review_requests")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", requestId);
}

/**
 * Track when a customer clicks the review link
 */
export async function trackReviewClick(requestId: string): Promise<void> {
  await supabase
    .from("review_requests")
    .update({
      clicked_at: new Date().toISOString(),
    })
    .eq("id", requestId);
}
