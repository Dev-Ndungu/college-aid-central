
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReferralEmailRequest {
  inviteeEmail: string;
  referrerName: string;
  referralLink: string;
  discountValue: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inviteeEmail, referrerName, referralLink, discountValue }: ReferralEmailRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "Assignment Hub <onboarding@resend.dev>",
      to: [inviteeEmail],
      subject: `${referrerName} invited you to Assignment Hub ✒️ - Get ${discountValue}% off!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0d2241; margin: 0;">Assignment Hub ✒️</h1>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">You've been invited to Assignment Hub!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Great news! <strong>${referrerName}</strong> has invited you to join Assignment Hub ✒️, 
            the best platform for academic writing assistance.
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0d2241; margin-top: 0;">🎉 Special Offer Just for You!</h3>
            <p style="color: #333; font-size: 18px; margin: 10px 0;">
              Get <strong style="color: #e74c3c;">${discountValue}% OFF</strong> your first assignment when you sign up through this referral link!
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${referralLink}" 
               style="background-color: #0d2241; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 5px; font-size: 16px; 
                      font-weight: bold; display: inline-block;">
              Join Assignment Hub & Claim Your Discount
            </a>
          </div>
          
          <div style="color: #666; font-size: 14px; margin-top: 30px;">
            <p>Why choose Assignment Hub?</p>
            <ul style="padding-left: 20px;">
              <li>Expert writers with academic backgrounds</li>
              <li>24/7 customer support</li>
              <li>Plagiarism-free content guaranteed</li>
              <li>On-time delivery promise</li>
            </ul>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; 
                      color: #999; font-size: 12px; text-align: center;">
            <p>This invitation was sent by ${referrerName}. If you don't want to receive these emails, you can ignore this message.</p>
            <p>© 2024 Assignment Hub. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    console.log("Referral email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-referral-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
