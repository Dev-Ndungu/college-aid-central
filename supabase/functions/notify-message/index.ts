
// Edge function that handles sending notifications for assignment-related events
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Resend } from 'npm:resend';

// Initialize Resend with API key
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Developer email for when domain verification is not set up
const DEVELOPER_EMAIL = "kelvinnj104@gmail.com"; // This matches your Resend account email

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request (CORS preflight)");
    return new Response(null, {
      headers: corsHeaders
    });
  }
  
  // Log the full request URL
  console.log("Full request URL:", req.url);
  
  // Check if this is a POST request to the notify-message endpoint
  console.log("📨 Notification endpoint called. Method:", req.method);
  
  try {
    // Log info about the Supabase client
    console.log("Creating Supabase client with URL:", supabaseUrl ? "URL exists" : "URL missing");
    console.log("Service role key exists:", supabaseKey ? "Yes" : "No");
    
    // Get the request payload
    const rawPayload = await req.text();
    console.log("Raw request payload:", rawPayload);
    
    const payload = JSON.parse(rawPayload);
    console.log("Request payload type:", payload.type);
    
    // Full debug of the payload
    console.log("Full payload:", JSON.stringify(payload));
    
    // Handle different notification types
    if (payload.type === "assignment_submitted") {
      console.log("Processing assignment_submitted notification. Assignment title:", payload.assignment.title);
      await handleAssignmentSubmitted(payload.assignment);
    } else if (payload.type === "assignment_taken") {
      console.log("Processing assignment_taken notification");
      await handleAssignmentTaken(payload.assignment, payload.writer);
    } else if (payload.type === "assignment_status_update") {
      console.log("Processing assignment_status_update notification");
      await handleAssignmentStatusUpdate(payload.assignment, payload.writer, payload.status);
    } else if (payload.type === "writer_direct_email") {
      console.log("Processing writer_direct_email notification");
      await handleWriterDirectEmail(payload);
    } else {
      console.log("Unknown notification type:", payload.type);
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing notification:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Helper function to safely send email and handle domain verification errors
async function safelySendEmail(emailOptions) {
  try {
    if (!resend) {
      console.error("Resend API key not configured");
      return { success: false, error: "Resend API key not configured" };
    }

    // Try to send the email as requested
    const result = await resend.emails.send(emailOptions);
    
    // Log the result for debugging
    console.log(`Email send attempt result:`, result);
    
    if (result.error) {
      // If there's a domain verification error, we'll send to the developer instead
      if (result.error.statusCode === 403 && result.error.name === "validation_error") {
        console.log("Domain validation error detected. Sending notification to developer instead");
        
        // Clone the email options but change recipient to developer
        const devEmailOptions = {
          ...emailOptions,
          to: DEVELOPER_EMAIL,
          subject: `[DOMAIN NOT VERIFIED] ${emailOptions.subject}`,
          html: `
            <div style="background-color: #ffecb3; padding: 10px; margin-bottom: 15px; border-left: 4px solid #ff9800;">
              <p><strong>TESTING MODE:</strong> This email was meant for: ${Array.isArray(emailOptions.to) ? emailOptions.to.join(', ') : emailOptions.to}</p>
              <p>To send emails to actual students, verify a domain at <a href="https://resend.com/domains">resend.com/domains</a></p>
            </div>
            ${emailOptions.html}
          `
        };
        
        // Send to developer instead
        const devResult = await resend.emails.send(devEmailOptions);
        console.log(`Developer notification email result:`, devResult);
        
        // Return original error but with additional info
        return { 
          success: false,
          error: result.error,
          devEmailSent: !devResult.error
        };
      }
      
      // For other errors, just return the error
      return { success: false, error: result.error };
    }
    
    return { success: true, data: result.data };
  } catch (err) {
    console.error("Error in safelySendEmail:", err);
    return { success: false, error: err };
  }
}

// Handle writer direct emails to students
async function handleWriterDirectEmail(payload) {
  try {
    const { recipient, sender, message, assignment } = payload;
    
    if (!recipient || !recipient.email) {
      throw new Error("Recipient email is missing");
    }
    
    console.log(`Processing direct email from writer to student: ${recipient.email}`);
    
    const emailResult = await safelySendEmail({
      from: 'Assignment Hub <onboarding@resend.dev>',
      to: recipient.email,
      subject: message.subject,
      html: message.body,
      // Add reply-to header so replies go back to the writer
      replyTo: sender.email
    });
    
    if (!emailResult.success) {
      console.log("Email sending failed but handled gracefully:", emailResult.error);
    }
    
    return emailResult.success;
  } catch (error) {
    console.error("Error handling writer direct email:", error);
    throw error;
  }
}

// Handle notifications for new assignment submissions
async function handleAssignmentSubmitted(assignment) {
  console.log("Using Resend API key:", resendApiKey ? "API key exists" : "API key missing");
  
  // 1. Notify writers about the new assignment
  try {
    // Find writers to notify
    const { data: writers, error } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('role', 'writer');
      
    if (error) {
      throw new Error(`Error fetching writers: ${error.message}`);
    }
    
    console.log(`Found ${writers?.length || 0} writers to notify about new assignment`);
    
    // Send email to each writer
    const emailPromises = writers?.map(async (writer) => {
      try {
        console.log(`Sending email to writer ${writer.email} about new assignment`);
        
        const emailResult = await safelySendEmail({
          from: 'Assignment Notification <onboarding@resend.dev>',
          to: writer.email,
          subject: 'New Assignment Submitted',
          html: `
            <h2>New Assignment Available</h2>
            <p>A new assignment has been submitted:</p>
            <p><strong>Title:</strong> ${assignment.title}</p>
            <p><strong>Subject:</strong> ${assignment.subject}</p>
            <p><strong>Log in to your dashboard to view the assignment and take it if interested.</strong></p>
          `,
        });
        
        console.log(`Email sent successfully to writer ${writer.email}:`, emailResult);
        return { success: true, email: writer.email };
      } catch (err) {
        console.error(`Error sending email to writer ${writer.email}:`, err);
        return { success: false, email: writer.email, error: err };
      }
    }) || [];
    
    // Wait for all emails to be sent
    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`Email sending summary: ${successful} successful, ${failed} failed`);
    
    // 2. Send confirmation email to student who submitted the assignment
    // This is critical for both logged-in and anonymous students
    // If student has a user_id, they are logged in, so get their email from profiles
    if (assignment.is_verified_account && assignment.user_id) {
      try {
        const { data: studentProfile, error: profileError } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', assignment.user_id)
          .single();
          
        if (profileError) {
          console.error("Error fetching student profile for confirmation:", profileError);
        } else if (studentProfile && studentProfile.email) {
          console.log(`Found student in profiles for confirmation email: ${studentProfile.email}`);
          
          // Send confirmation email to the student
          console.log(`Sending confirmation email to student: ${studentProfile.email}`);
          const studentEmailResult = await safelySendEmail({
            from: 'Assignment Confirmation <onboarding@resend.dev>',
            to: studentProfile.email,
            subject: 'Your Assignment Was Submitted Successfully',
            html: `
              <h2>Assignment Submitted Successfully</h2>
              <p>Hello ${studentProfile.full_name || 'there'},</p>
              <p>Your assignment has been submitted successfully:</p>
              <p><strong>Title:</strong> ${assignment.title}</p>
              <p><strong>Subject:</strong> ${assignment.subject}</p>
              <p>We'll notify you when a writer takes your assignment.</p>
              <p>Thank you!</p>
            `,
          });
          
          console.log(`Confirmation email sent successfully to student:`, studentEmailResult);
        } else {
          console.log("Student profile found but email is missing");
        }
      } catch (err) {
        console.error("Error sending confirmation email to student:", err);
      }
    } 
    // If using student_email from the assignment (for anonymous submissions)
    else if (assignment.student_email) {
      try {
        console.log(`Sending confirmation email to anonymous student: ${assignment.student_email}`);
        const studentEmailResult = await safelySendEmail({
          from: 'Assignment Confirmation <onboarding@resend.dev>',
          to: assignment.student_email,
          subject: 'Your Assignment Was Submitted Successfully',
          html: `
            <h2>Assignment Submitted Successfully</h2>
            <p>Hello ${assignment.student_name || 'there'},</p>
            <p>Your assignment has been submitted successfully:</p>
            <p><strong>Title:</strong> ${assignment.title}</p>
            <p><strong>Subject:</strong> ${assignment.subject}</p>
            <p>We'll notify you when a writer takes your assignment.</p>
            <p>Thank you!</p>
          `,
        });
        
        console.log(`Confirmation email sent successfully to anonymous student:`, studentEmailResult);
      } catch (err) {
        console.error("Error sending confirmation email to anonymous student:", err);
      }
    } else {
      console.log("No student email found to send confirmation");
    }
    
  } catch (error) {
    console.error("Error handling assignment submission notification:", error);
    throw error;
  }
}

// Handle notifications for when a writer takes an assignment
async function handleAssignmentTaken(assignment, writer) {
  try {
    // Determine the student's email for notification
    let studentEmail = null;
    let studentName = "there";
    
    // If this is a verified account (user_id exists), get student email from profiles
    if (assignment.is_verified_account && assignment.user_id) {
      const { data: studentProfile, error } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', assignment.user_id)
        .single();
        
      if (error) {
        console.error("Error fetching student profile:", error);
      } else if (studentProfile) {
        studentEmail = studentProfile.email;
        studentName = studentProfile.full_name || "there";
        console.log(`Using student email from profile: ${studentEmail}`);
      }
    } 
    // Otherwise, use the student email provided during submission (anonymous)
    else if (assignment.student_email) {
      studentEmail = assignment.student_email;
      studentName = assignment.student_name || "there";
      console.log(`Using student email from assignment: ${studentEmail}`);
    }
    
    if (!studentEmail) {
      console.error("No student email found to send notification");
      return;
    }
    
    // Send email to student
    console.log(`Sending assignment taken notification to student: ${studentEmail}`);
    
    const emailResult = await safelySendEmail({
      from: 'Assignment Update <onboarding@resend.dev>',
      to: studentEmail,
      subject: 'Your Assignment Has Been Taken',
      html: `
        <h2>Good News!</h2>
        <p>Hello ${studentName},</p>
        <p>Your assignment "${assignment.title}" has been taken by a writer:</p>
        <p><strong>Writer:</strong> ${writer?.full_name || 'A professional writer'}</p>
        <p>They will start working on it right away. You'll receive updates as they make progress.</p>
        <p>Thank you for using our service!</p>
      `,
    });
    
    console.log(`Assignment taken notification sent to student:`, emailResult);
  } catch (error) {
    console.error("Error handling assignment taken notification:", error);
    throw error;
  }
}

// Handle notifications for assignment status updates
async function handleAssignmentStatusUpdate(assignment, writer, status) {
  try {
    // Determine the student's email for notification
    let studentEmail = null;
    let studentName = "there";
    
    // If this is a verified account (user_id exists), get student email from profiles
    if (assignment.is_verified_account && assignment.user_id) {
      const { data: studentProfile, error } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', assignment.user_id)
        .single();
        
      if (error) {
        console.error("Error fetching student profile for status update:", error);
      } else if (studentProfile) {
        studentEmail = studentProfile.email;
        studentName = studentProfile.full_name || "there";
        console.log(`Using student email from profile for status update: ${studentEmail}`);
      }
    } 
    // Otherwise, use the student email provided during submission (anonymous)
    else if (assignment.student_email) {
      studentEmail = assignment.student_email;
      studentName = assignment.student_name || "there";
      console.log(`Using student email from assignment for status update: ${studentEmail}`);
    }
    
    if (!studentEmail) {
      console.error("No student email found to send status update notification");
      return;
    }
    
    // Format status for display
    let statusDisplay = status;
    let statusMessage = "";
    
    switch (status) {
      case "in_progress":
        statusDisplay = "In Progress";
        statusMessage = "The writer has started working on your assignment.";
        break;
      case "almost_done":
        statusDisplay = "Almost Done";
        statusMessage = "Your assignment is nearly complete!";
        break;
      case "completed":
        statusDisplay = "Completed";
        statusMessage = "Your assignment has been completed!";
        break;
      default:
        statusDisplay = status.replace(/_/g, ' ');
        statusDisplay = statusDisplay.charAt(0).toUpperCase() + statusDisplay.slice(1);
    }
    
    // Send email to student
    console.log(`Sending status update notification to student: ${studentEmail}`);
    
    const emailResult = await safelySendEmail({
      from: 'Assignment Update <onboarding@resend.dev>',
      to: studentEmail,
      subject: `Assignment Status Update: ${statusDisplay}`,
      html: `
        <h2>Assignment Status Update</h2>
        <p>Hello ${studentName},</p>
        <p>There's an update on your assignment "${assignment.title}":</p>
        <p><strong>New Status:</strong> ${statusDisplay}</p>
        <p>${statusMessage}</p>
        <p><strong>Writer:</strong> ${writer?.full_name || 'Your assigned writer'}</p>
        <p>Thank you for using our service!</p>
      `,
    });
    
    console.log(`Status update notification sent to student:`, emailResult);
  } catch (error) {
    console.error("Error handling status update notification:", error);
    throw error;
  }
}
