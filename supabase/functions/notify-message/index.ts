
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, assignment, writer, status, priceUpdate } = await req.json();
    
    console.log(`Processing notification type: ${type}`);
    
    // Initialize Supabase client with service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    let emailBody: string;
    let emailSubject: string;
    let recipientEmail: string;
    
    // Get assignment details if not available
    let assignmentData = assignment;
    if (!assignmentData) {
      const { data, error } = await supabaseAdmin
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();
        
      if (error) {
        throw new Error(`Failed to fetch assignment: ${error.message}`);
      }
      
      assignmentData = data;
    }
    
    // Determine the email content based on notification type
    switch (type) {
      case 'assignment_submitted':
        if (!assignmentData.student_email) {
          throw new Error(`No student email available for assignment ${assignmentData.id}`);
        }
    
        recipientEmail = 'worldwritingfoundation@gmail.com'; // Notify admin
        emailSubject = `New Assignment Submitted: ${assignmentData.title}`;
    
        emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; padding: 15px; text-align: center; color: white; }
    .content { padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
    .button { background-color: #4F46E5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Assignment Submission</h2>
    </div>
    <div class="content">
      <p>A new assignment has been submitted by ${assignmentData.student_name || assignmentData.student_email}:</p>
      <p><strong>Title:</strong> ${assignmentData.title}</p>
      <p><strong>Subject:</strong> ${assignmentData.subject}</p>
      <p><strong>Description:</strong> ${assignmentData.description || 'No description provided.'}</p>
      <p>Please review the assignment details and assign it to a writer.</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="https://assignmenthub.org/#/dashboard" class="button">View Dashboard</a>
      </p>
    </div>
    <div class="footer">
      <p>This email was sent from AssignmentHub. If you have any questions, please contact us at inquiries@assignmenthub.org</p>
    </div>
  </div>
</body>
</html>
        `;
        break;
        
      case 'assignment_taken':
        if (!assignmentData.student_email) {
          throw new Error(`No student email available for assignment ${assignmentData.id}`);
        }
    
        recipientEmail = assignmentData.student_email;
        emailSubject = `Writer Assigned to Your Assignment: ${assignmentData.title}`;
    
        const assignmentTakenWriterName = writer?.full_name || 'A writer';
        const assignmentTakenWriterEmail = writer?.email || 'the writer';
    
        emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; padding: 15px; text-align: center; color: white; }
    .content { padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
    .button { background-color: #4F46E5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Writer Assigned</h2>
    </div>
    <div class="content">
      <p>Hello ${assignmentData.student_name || assignmentData.student_email},</p>
      <p>${assignmentTakenWriterName} has been assigned to your assignment <strong>${assignmentData.title}</strong>.</p>
      <p>You can communicate with the writer at ${assignmentTakenWriterEmail} for any clarifications or updates.</p>
    </div>
    <div class="footer">
      <p>This email was sent from AssignmentHub. If you have any questions, please contact us at inquiries@assignmenthub.org</p>
    </div>
  </div>
</body>
</html>
        `;
        break;
        
      case 'assignment_status_update':
        if (!assignmentData.student_email) {
          throw new Error(`No student email available for assignment ${assignmentData.id}`);
        }
    
        recipientEmail = assignmentData.student_email;
        emailSubject = `Assignment Status Updated: ${assignmentData.title}`;
    
        const statusUpdateWriterName = writer?.full_name || 'Your writer';
        const statusText = status ? `to ${status}` : 'with an update';
    
        emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; padding: 15px; text-align: center; color: white; }
    .content { padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
    .button { background-color: #4F46E5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Assignment Status Update</h2>
    </div>
    <div class="content">
      <p>Hello ${assignmentData.student_name || assignmentData.student_email},</p>
      <p>${statusUpdateWriterName} has updated the status of your assignment <strong>${assignmentData.title}</strong> ${statusText}.</p>
      <p>Please check your dashboard for more details.</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="https://assignmenthub.org/#/dashboard" class="button">View Dashboard</a>
      </p>
    </div>
    <div class="footer">
      <p>This email was sent from AssignmentHub. If you have any questions, please contact us at inquiries@assignmenthub.org</p>
    </div>
  </div>
</body>
</html>
        `;
        break;
        
      case 'assignment_price_update':
        // This is for notifying students about price updates
        if (!assignmentData.student_email) {
          throw new Error(`No student email available for assignment ${assignmentData.id}`);
        }
        
        const formattedPrice = assignmentData.price ? `$${assignmentData.price}` : 'Not set';
        recipientEmail = assignmentData.student_email;
        emailSubject = `Price Update for Your Assignment: ${assignmentData.title}`;
        
        const priceUpdateWriterName = writer?.full_name || 'Your writer';
        
        emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; padding: 15px; text-align: center; color: white; }
    .content { padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
    .button { background-color: #4F46E5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Assignment Price Update</h2>
    </div>
    <div class="content">
      <p>Hello ${assignmentData.student_name || assignmentData.student_email},</p>
      <p>${priceUpdateWriterName} has updated the price for your assignment <strong>${assignmentData.title}</strong>.</p>
      <p><strong>New Price:</strong> ${formattedPrice}</p>
      <p>You can now proceed with payment on your dashboard to complete the transaction.</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="https://assignmenthub.org/#/checkout/${assignmentData.id}" class="button">Pay Now</a>
      </p>
    </div>
    <div class="footer">
      <p>This email was sent from AssignmentHub. If you have any questions, please contact us at inquiries@assignmenthub.org</p>
    </div>
  </div>
</body>
</html>
        `;
        break;

      case 'assignment_progress_update':
        if (!assignmentData.student_email) {
          throw new Error(`No student email available for assignment ${assignmentData.id}`);
        }
        
        recipientEmail = assignmentData.student_email;
        emailSubject = `Progress Update for Your Assignment: ${assignmentData.title}`;
        
        const progressUpdateWriterName = writer?.full_name || 'Your writer';
        const progressPercent = assignmentData.progress || 0;
        
        emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; padding: 15px; text-align: center; color: white; }
    .content { padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
    .button { background-color: #4F46E5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; }
    .progress-bar { width: 100%; height: 20px; background-color: #e0e0e0; border-radius: 10px; overflow: hidden; margin: 10px 0; }
    .progress-fill { height: 100%; background-color: #4F46E5; width: ${progressPercent}%; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Assignment Progress Update</h2>
    </div>
    <div class="content">
      <p>Hello ${assignmentData.student_name || assignmentData.student_email},</p>
      <p>${progressUpdateWriterName} has updated the progress on your assignment <strong>${assignmentData.title}</strong>.</p>
      <p><strong>Current Progress:</strong> ${progressPercent}%</p>
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
      <p>You can check your dashboard for more details about your assignment.</p>
      <p style="text-align: center; margin-top: 30px;">
        <a href="https://assignmenthub.org/#/dashboard" class="button">View Dashboard</a>
      </p>
    </div>
    <div class="footer">
      <p>This email was sent from AssignmentHub. If you have any questions, please contact us at inquiries@assignmenthub.org</p>
    </div>
  </div>
</body>
</html>
        `;
        break;

      case 'writer_direct_email':
        const { recipient, sender, message } = await req.json();
        
        recipientEmail = recipient.email;
        emailSubject = message.subject;
        
        emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; padding: 15px; text-align: center; color: white; }
    .content { padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
    .message-body { white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Message from Assignment Hub</h2>
    </div>
    <div class="content">
      <div class="message-body">${message.body}</div>
    </div>
    <div class="footer">
      <p>This email was sent from AssignmentHub. If you have any questions, please contact us at inquiries@assignmenthub.org</p>
    </div>
  </div>
</body>
</html>
        `;
        break;
        
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
    
    console.log(`Sending email to: ${recipientEmail}`);
    console.log(`Email subject: ${emailSubject}`);
    
    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Assignment Hub <onboarding@resend.dev>',
      to: [recipientEmail],
      subject: emailSubject,
      html: emailBody,
    });
    
    if (error) {
      console.error('Resend error:', error);
      throw new Error(`Failed to send email via Resend: ${error.message}`);
    }
    
    console.log("Email sent successfully via Resend:", data);
    
    // Return success response
    return new Response(
      JSON.stringify({ success: true, message: "Notification sent successfully", data }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in notify-message function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Error sending notification",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
