
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Get the URL for debugging
    console.log("Full request URL:", req.url);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    console.log("Creating Supabase client with URL:", supabaseUrl ? "URL exists" : "URL missing");
    console.log("Service role key exists:", supabaseKey ? "Yes" : "No");

    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Log request method for debugging
    console.log(`📨 Notification endpoint called. Method: ${req.method}`);

    // Parse the request body
    const rawBody = await req.text();
    console.log("Raw request payload:", rawBody);
    
    const body = JSON.parse(rawBody);
    
    console.log("Request payload type:", body.type);
    console.log("Full payload:", JSON.stringify(body));

    // Handle different notification types
    switch (body.type) {
      case 'assignment_submitted':
        // Notification logic for when a student submits a new assignment
        console.log(`Processing assignment_submitted notification. Assignment ID: ${body.assignment?.id}`);
        await sendSubmissionConfirmationToStudent(body.assignment);
        break;

      case 'assignment_taken':
        // Notification logic for when a writer takes an assignment
        console.log(`Processing assignment_taken notification. Assignment ID: ${body.assignment?.id}`);
        await sendWriterTookAssignmentEmail(body.assignment, body.writer);
        break;

      case 'assignment_status_update':
        // Notification logic for when a writer updates status of an assignment
        console.log(`Processing assignment_status_update notification. Assignment ID: ${body.assignment?.id}`);
        await sendStatusUpdateEmail(body.assignment, body.writer, body.status);
        break;
        
      case 'writer_direct_email':
        // Direct email from writer to student
        console.log(`Processing writer_direct_email notification.`);
        await sendDirectEmailFromWriter(body);
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: `Unknown notification type: ${body.type}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    return new Response(
      JSON.stringify({ message: "Notification sent successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Helper function to send email using native fetch instead of Resend's axios-based client
async function sendEmail(options: {
  from: string;
  to: string[];
  subject: string;
  html: string;
}) {
  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Resend API error response:", errorData);
      throw new Error(`Failed to send email: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

// Email functions - updated to use the native fetch implementation
async function sendSubmissionConfirmationToStudent(assignment: any) {
  try {
    // If the assignment has student details, send to their email
    const studentEmail = assignment.student_email;
    const studentName = assignment.student_name || "Student";
    
    if (studentEmail) {
      // Generate contact links with appropriate UTM parameters
      const whatsappLink = `https://wa.me/+12368801220?text=Hi,%20I%20need%20help%20with%20my%20assignment%20${encodeURIComponent(assignment.title)}`;
      const emailLink = `mailto:write.mefoundation@gmail.com?subject=Help%20with%20assignment:%20${encodeURIComponent(assignment.title)}&body=Hello,%20I%20need%20assistance%20with%20my%20assignment.%0A%0AAssignment%20details:%0A-%20Title:%20${encodeURIComponent(assignment.title)}%0A-%20Subject:%20${encodeURIComponent(assignment.subject)}`;
      
      const emailResult = await sendEmail({
        from: "WriterHub <assignments@writerhub.com>",
        to: [studentEmail],
        subject: `Your assignment has been received: ${assignment.title}`,
        html: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #4f46e5; }
              h1 { color: #4f46e5; margin-top: 0; }
              .details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
              .details h2 { margin-top: 0; font-size: 18px; color: #333; }
              .button-container { margin-top: 30px; text-align: center; }
              .button {
                display: inline-block;
                padding: 10px 20px;
                margin: 0 10px;
                border-radius: 5px;
                text-decoration: none;
                font-weight: bold;
                color: white;
              }
              .whatsapp { background-color: #25D366; }
              .email { background-color: #4f46e5; }
              .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Assignment Received!</h1>
                <p>Hello ${studentName},</p>
                <p>Thank you for submitting your assignment. Our team will review it shortly.</p>
              </div>
              
              <div class="details">
                <h2>Assignment Details:</h2>
                <p><strong>Title:</strong> ${assignment.title}</p>
                <p><strong>Subject:</strong> ${assignment.subject}</p>
                <p><strong>Submission Date:</strong> ${new Date(assignment.created_at).toLocaleString()}</p>
              </div>
              
              <p>A writer will be assigned to your assignment soon. We'll notify you when a writer has started working on it.</p>
              
              <p>Need immediate assistance?</p>
              
              <div class="button-container">
                <a href="${whatsappLink}" class="button whatsapp">Contact via WhatsApp</a>
                <a href="${emailLink}" class="button email">Contact via Email</a>
              </div>
              
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} WriterHub. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
        `,
      });
      
      console.log("Submission confirmation email sent successfully");
      return true;
    } else {
      console.log("No student email provided; skipping submission confirmation");
      return false;
    }
  } catch (error) {
    console.error("Error in sendSubmissionConfirmationToStudent:", error);
    return false;
  }
}

async function sendWriterTookAssignmentEmail(assignment: any, writer: any) {
  try {
    // First check if we have a student email to send to
    if (!assignment.user_id && !assignment.student_email) {
      console.log("No student to notify about writer taking assignment");
      return false;
    }
    
    // If we have user_id, find their email from profiles
    let studentEmail = assignment.student_email;
    let studentName = assignment.student_name || "Student";
    
    if (assignment.user_id && !studentEmail) {
      // Try to get student email from profiles
      const { data: studentData, error: studentError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', assignment.user_id)
        .single();
        
      if (studentError) {
        console.error("Error fetching student data:", studentError);
      } else if (studentData) {
        studentEmail = studentData.email;
        studentName = studentData.full_name || studentName;
      }
    }
    
    if (studentEmail) {
      console.log("Sending email to student:", studentEmail);
      
      const emailResult = await sendEmail({
        from: "WriterHub <assignments@writerhub.com>",
        to: [studentEmail],
        subject: `A writer has taken your assignment: ${assignment.title}`,
        html: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #4f46e5; }
              h1 { color: #4f46e5; margin-top: 0; }
              .writer { background-color: #e8f4ff; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #3b82f6; }
              .details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
              .details h2 { margin-top: 0; font-size: 18px; color: #333; }
              .button { display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
              .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Good News!</h1>
                <p>Hello ${studentName},</p>
                <p>A writer has taken your assignment and started working on it.</p>
              </div>
              
              <div class="writer">
                <h2>Writer Information:</h2>
                <p><strong>Name:</strong> ${writer?.full_name || 'Assigned Writer'}</p>
              </div>
              
              <div class="details">
                <h2>Assignment Details:</h2>
                <p><strong>Title:</strong> ${assignment.title}</p>
                <p><strong>Subject:</strong> ${assignment.subject}</p>
                <p><strong>Status:</strong> In Progress</p>
              </div>
              
              <p>You will receive updates as the writer makes progress on your assignment. You can also log in to your dashboard to check the status anytime.</p>
              
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} WriterHub. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
        `,
      });
      
      console.log("Email sent successfully");
      return true;
    } else {
      console.log("No student email found; skipping assignment taken notification");
      return false;
    }
  } catch (error) {
    console.error("Error in sendWriterTookAssignmentEmail:", error);
    return false;
  }
}

async function sendStatusUpdateEmail(assignment: any, writer: any, status: string) {
  try {
    // First check if we have a student email to send to
    if (!assignment.user_id && !assignment.student_email) {
      console.log("No student to notify about status update");
      return false;
    }
    
    // If we have user_id, find their email from profiles
    let studentEmail = assignment.student_email;
    let studentName = assignment.student_name || "Student";
    
    if (assignment.user_id && !studentEmail) {
      // Try to get student email from profiles
      const { data: studentData, error: studentError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', assignment.user_id)
        .single();
        
      if (studentError) {
        console.error("Error fetching student data:", studentError);
      } else if (studentData) {
        studentEmail = studentData.email;
        studentName = studentData.full_name || studentName;
        console.log("Found student in profiles:", studentEmail);
      }
    }
    
    if (studentEmail) {
      console.log("Sending status update email to student:", studentEmail);
      
      // Get status display text
      const statusText = (() => {
        switch (status || assignment.status) {
          case 'in_progress': return 'In Progress';
          case 'almost_done': return 'Almost Done';
          case 'completed': return 'Completed';
          default: return 'Updated';
        }
      })();
      
      // Get status text for messaging
      const statusMessage = (() => {
        switch (status || assignment.status) {
          case 'in_progress': 
            return 'The writer has started working on your assignment.';
          case 'almost_done': 
            return 'The writer is almost done with your assignment. Just a little more time needed to perfect it.';
          case 'completed': 
            return 'Great news! Your assignment has been completed. You can now log in to view and download it.';
          default: 
            return 'Your assignment status has been updated.';
        }
      })();
      
      // Get status color
      const statusColor = (() => {
        switch (status || assignment.status) {
          case 'in_progress': return '#3b82f6'; // Blue
          case 'almost_done': return '#8b5cf6'; // Purple
          case 'completed': return '#10b981'; // Green
          default: return '#4f46e5'; // Default indigo
        }
      })();
      
      const emailResult = await sendEmail({
        from: "WriterHub <assignments@writerhub.com>",
        to: [studentEmail],
        subject: `Update on your assignment: ${assignment.title}`,
        html: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid ${statusColor}; }
              h1 { color: ${statusColor}; margin-top: 0; }
              .status { background-color: ${statusColor}20; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid ${statusColor}; }
              .status-badge { display: inline-block; padding: 5px 10px; background-color: ${statusColor}; color: white; border-radius: 20px; font-size: 14px; margin-top: 5px; }
              .details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
              .details h2 { margin-top: 0; font-size: 18px; color: #333; }
              .button { display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px; }
              .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
              .progress-bar { height: 10px; width: 100%; background-color: #e2e8f0; border-radius: 5px; overflow: hidden; }
              .progress-fill { height: 100%; background-color: ${statusColor}; width: ${assignment.progress || 0}%; }
              .progress-text { text-align: right; font-size: 12px; color: #64748b; margin-top: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Assignment Update</h1>
                <p>Hello ${studentName},</p>
                <p>${statusMessage}</p>
              </div>
              
              <div class="status">
                <h2>Status Update:</h2>
                <div class="status-badge">${statusText}</div>
                
                <div style="margin-top: 15px;">
                  <div style="margin-bottom: 5px;">Progress:</div>
                  <div class="progress-bar">
                    <div class="progress-fill"></div>
                  </div>
                  <div class="progress-text">${assignment.progress || 0}% complete</div>
                </div>
              </div>
              
              <div class="details">
                <h2>Assignment Details:</h2>
                <p><strong>Title:</strong> ${assignment.title}</p>
                <p><strong>Subject:</strong> ${assignment.subject}</p>
                <p><strong>Last Updated:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              ${status === 'completed' ? `
                <p>Your assignment has been completed! Please log in to your account to view and download the completed work.</p>
                <a href="https://writerhub-ai.vercel.app/dashboard" class="button">View Completed Assignment</a>
              ` : `
                <p>You can log in to your dashboard anytime to check the latest status of your assignment.</p>
                <a href="https://writerhub-ai.vercel.app/dashboard" class="button">Check Assignment Status</a>
              `}
              
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} WriterHub. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
        `,
      });
      
      console.log("Status update email sent successfully");
      return true;
    } else {
      console.log("No student email found; skipping status update notification");
      return false;
    }
  } catch (error) {
    console.error("Error in sendStatusUpdateEmail:", error);
    return false;
  }
}

// Function to handle direct emails from writers to students
async function sendDirectEmailFromWriter(data: any) {
  try {
    const { recipient, sender, message, assignment } = data;
    
    if (!recipient || !recipient.email) {
      console.error("Missing recipient email");
      return false;
    }
    
    console.log(`Sending direct email to student: ${recipient.email}`);
    
    const emailResult = await sendEmail({
      from: "Assignment Hub <no-reply@writerhub.com>",
      to: [recipient.email],
      subject: message.subject,
      html: `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #4f46e5; }
            h1 { color: #4f46e5; margin-top: 0; }
            .message { background-color: #ffffff; padding: 20px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #e2e8f0; }
            .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Message from Assignment Hub</h1>
              <p>Hello ${recipient.name || 'Student'},</p>
              <p>You have received a message regarding your assignment "${assignment.title}".</p>
            </div>
            
            <div class="message">
              ${message.body.replace(/\n/g, '<br>')}
            </div>
            
            <div class="footer">
              <p>To reply to this message, please log in to your dashboard or reply directly to this email.</p>
              <p>This email was sent by the Assignment Hub Team on behalf of your writer.</p>
              <p>&copy; ${new Date().getFullYear()} Assignment Hub. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
      `,
    });
    
    console.log("Direct email sent successfully");
    return true;
  } catch (error) {
    console.error("Error in sendDirectEmailFromWriter:", error);
    return false;
  }
}

// Add supabase global variable from the earlier template
let supabase: any;
