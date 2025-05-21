// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { Resend } from "https://esm.sh/resend@2.0.0";

// Initialize Resend with API key
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl as string, supabaseKey as string);

// Types for payload
interface AssignmentSubmittedPayload {
  type: 'assignment_submitted';
  assignment: any;
}

interface AssignmentTakenPayload {
  type: 'assignment_taken';
  assignment: any;
  writer: Writer;
}

interface AssignmentStatusUpdatePayload {
  type: 'assignment_status_update';
  assignment: any;
  status: string;
  writer: Writer;
}

interface WriterDirectEmailPayload {
  type: 'writer_direct_email';
  student_email: string;
  student_name: string;
  subject: string;
  message: string;
  assignment_id: string;
  writer: Writer;
}

// Writer type
type Writer = {
  id: string;
  full_name: string | null;
  email: string;
};

Deno.serve(async (req) => {
  console.log("📨 Notification endpoint called. Method:", req.method);
  console.log("Full request URL:", req.url);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request (CORS preflight)");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    
    console.log("Raw request payload:", JSON.stringify(payload));
    console.log("Request payload type:", payload.type);
    
    // Log the full payload for debugging
    console.log("Full payload:", JSON.stringify(payload));
    
    switch(payload.type) {
      case 'assignment_submitted':
        // Existing code for assignment submission notification
        return await handleAssignmentSubmitted(payload);
      
      case 'assignment_taken':
        // Existing code for assignment taken notification
        return await handleAssignmentTaken(payload as AssignmentTakenPayload);
        
      case 'assignment_status_update':
        // Existing code for status update notification
        return await handleAssignmentStatusUpdate(payload as AssignmentStatusUpdatePayload);
        
      case 'writer_direct_email':
        // New handler for direct emails from writer to student
        return await handleWriterDirectEmail(payload as WriterDirectEmailPayload);
        
      default:
        throw new Error(`Unknown notification type: ${payload.type}`);
    }
  } catch (error) {
    console.error("Error processing notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Handler for assignment submission notifications
async function handleAssignmentSubmitted(payload: AssignmentSubmittedPayload) {
  // Get all writers to notify them
  const { data: writers, error } = await supabase
    .from('profiles')
    .select('email')
    .eq('role', 'writer');
  
  if (error) {
    console.error("Error fetching writers:", error);
    throw error;
  }
  
  const writerEmails = writers.map(writer => writer.email);
  
  if (writerEmails.length > 0) {
    try {
      await resend.emails.send({
        from: "Assignment Tutor <notifications@assignmenttutor.com>",
        to: writerEmails,
        subject: "New Assignment Available",
        html: `
          <h1>New Assignment Available</h1>
          <p>A new assignment has been submitted and is available to take:</p>
          <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="margin-top: 0;">${payload.assignment.title}</h2>
            <p><strong>Subject:</strong> ${payload.assignment.subject}</p>
            <p><strong>Description:</strong> ${payload.assignment.description || 'No description provided'}</p>
          </div>
          <p>Log in to your dashboard to take this assignment.</p>
        `,
      });
      
      console.log("Assignment submission notification sent to writers");
    } catch (error) {
      console.error("Error sending notification emails:", error);
      // Continue without throwing - we don't want to fail the entire function if email fails
    }
  }
  
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

// Handler for assignment taken notifications
async function handleAssignmentTaken(payload: AssignmentTakenPayload) {
  console.log("Processing assignment_taken notification. Assignment ID:", payload.assignment.id);
  
  try {
    // Find the student's email - first check if it's directly in the assignment
    let studentEmail = payload.assignment.student_email;
    let studentName = payload.assignment.student_name || "Student";
    
    // If not available directly, fetch from user profile
    if (!studentEmail && payload.assignment.user_id) {
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', payload.assignment.user_id)
        .single();
      
      if (userError) {
        console.error("Error fetching student data:", userError);
      } else if (userData) {
        studentEmail = userData.email;
        if (userData.full_name) {
          studentName = userData.full_name;
        }
      }
    }
    
    // If we have an email, send the notification
    if (studentEmail) {
      console.log("Found student:", studentEmail);
      console.log("Sending email to student:", studentEmail);
      
      const writerName = payload.writer?.full_name || payload.writer?.email || "A tutor";
      
      // Send email via Resend
      try {
        console.log("Using Resend API key:", Deno.env.get("RESEND_API_KEY") ? "API key exists" : "Missing API key");
        
        const emailResponse = await resend.emails.send({
          from: "Assignment Tutor <notifications@assignmenttutor.com>",
          to: studentEmail,
          subject: "Your Assignment Has Been Taken",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #0d2241; border-bottom: 2px solid #0d2241; padding-bottom: 10px;">Good News!</h1>
              
              <p>Hello ${studentName},</p>
              
              <p>We're pleased to inform you that your assignment "${payload.assignment.title}" has been taken by ${writerName}.</p>
              
              <div style="background-color: #f5f5f5; border-left: 4px solid #0d2241; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #0d2241;">Assignment Details:</h3>
                <p><strong>Title:</strong> ${payload.assignment.title}</p>
                <p><strong>Subject:</strong> ${payload.assignment.subject}</p>
                ${payload.assignment.due_date ? `<p><strong>Due Date:</strong> ${new Date(payload.assignment.due_date).toLocaleDateString()}</p>` : ''}
              </div>
              
              <p>Your writer will be working on your assignment and will keep you updated on their progress. You can also communicate with them through the chat feature in your dashboard.</p>
              
              <p>If you have any questions or need to provide additional information, please log in to your account and send a message.</p>
              
              <p style="margin-top: 30px;">Best regards,<br>The Assignment Tutor Team</p>
            </div>
          `,
        });
        
        console.log("Email sent successfully with Resend:", emailResponse);
      } catch (emailError: any) {
        console.error("Error sending email with Resend:", emailError);
        // Continue without throwing
      }
    } else {
      console.log("No student email found for notification");
    }
    
    console.log("Notification processing completed successfully");
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error("Error in assignment_taken notification:", error);
    throw error;
  }
}

// Handler for assignment status update notifications
async function handleAssignmentStatusUpdate(payload: AssignmentStatusUpdatePayload) {
  console.log("Processing assignment_status_update notification. Status:", payload.status);
  
  try {
    // Find the student's email - first check if it's directly in the assignment
    let studentEmail = payload.assignment.student_email;
    let studentName = payload.assignment.student_name || "Student";
    
    // If not available directly, fetch from user profile
    if (!studentEmail && payload.assignment.user_id) {
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', payload.assignment.user_id)
        .single();
      
      if (userError) {
        console.error("Error fetching student data for status update:", userError);
      } else if (userData) {
        studentEmail = userData.email;
        if (userData.full_name) {
          studentName = userData.full_name;
        }
      }
    }
    
    // If we have an email, send the notification
    if (studentEmail) {
      console.log("Found student for status update:", studentEmail);
      
      const writerName = payload.writer?.full_name || payload.writer?.email || "Your tutor";
      let statusText = '';
      let subject = '';
      
      // Customize message based on status
      switch (payload.status) {
        case 'in_progress':
          subject = "Your Assignment Is In Progress";
          statusText = `${writerName} has started working on your assignment.`;
          break;
        case 'almost_done':
          subject = "Your Assignment Is Almost Complete";
          statusText = `${writerName} is putting the finishing touches on your assignment.`;
          break;
        case 'completed':
          subject = "Your Assignment Is Complete!";
          statusText = `${writerName} has completed your assignment.`;
          break;
        default:
          subject = "Assignment Status Updated";
          statusText = `Your assignment status has been updated to ${payload.status.replace('_', ' ')}.`;
      }
      
      // Send email via Resend
      try {
        console.log("Sending status update email to student:", studentEmail);
        
        const emailResponse = await resend.emails.send({
          from: "Assignment Tutor <notifications@assignmenttutor.com>",
          to: studentEmail,
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #0d2241; border-bottom: 2px solid #0d2241; padding-bottom: 10px;">Assignment Update</h1>
              
              <p>Hello ${studentName},</p>
              
              <p>${statusText}</p>
              
              <div style="background-color: #f5f5f5; border-left: 4px solid #0d2241; padding: 15px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #0d2241;">Assignment Details:</h3>
                <p><strong>Title:</strong> ${payload.assignment.title}</p>
                <p><strong>Subject:</strong> ${payload.assignment.subject}</p>
                <p><strong>Status:</strong> <span style="color: ${
                  payload.status === 'completed' ? 'green' : 
                  payload.status === 'almost_done' ? 'blue' : 
                  'orange'
                };">${payload.status.replace('_', ' ')}</span></p>
              </div>
              
              <p>Log in to your account to view more details or to communicate with your writer.</p>
              
              <p style="margin-top: 30px;">Best regards,<br>The Assignment Tutor Team</p>
            </div>
          `,
        });
        
        console.log("Status update email sent successfully");
      } catch (emailError) {
        console.error("Error sending status update email:", emailError);
        // Continue without throwing
      }
    } else {
      console.log("No student email found for status update notification");
    }
    
    console.log("Status update notification processing completed successfully");
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error("Error in assignment_status_update notification:", error);
    throw error;
  }
}

// New handler for direct emails from writer to student
async function handleWriterDirectEmail(payload: WriterDirectEmailPayload) {
  console.log("Processing writer_direct_email notification");
  
  try {
    // Validate required fields
    if (!payload.student_email) {
      throw new Error("Missing student email");
    }
    
    if (!payload.subject || !payload.message) {
      throw new Error("Missing email subject or message");
    }
    
    const writerName = payload.writer?.full_name || payload.writer?.email || "Your tutor";
    
    // Send email via Resend
    try {
      console.log(`Sending direct email to ${payload.student_name} (${payload.student_email})`);
      
      const emailResponse = await resend.emails.send({
        from: "Assignment Tutor <notifications@assignmenttutor.com>",
        to: payload.student_email,
        replyTo: payload.writer.email,
        subject: payload.subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0d2241; border-bottom: 2px solid #0d2241; padding-bottom: 10px;">Message from ${writerName}</h1>
            
            <p>Hello ${payload.student_name},</p>
            
            <div style="background-color: #f5f5f5; border-left: 4px solid #0d2241; padding: 15px; margin: 20px 0;">
              <div style="white-space: pre-line;">${payload.message}</div>
            </div>
            
            <p>You can reply to this email directly or log in to your account to communicate with your writer.</p>
            
            <p style="margin-top: 30px;">Best regards,<br>${writerName}<br>The Assignment Tutor Team</p>
          </div>
        `,
      });
      
      console.log("Direct email sent successfully with Resend:", emailResponse);
      
      return new Response(JSON.stringify({ 
        success: true,
        message: "Email sent successfully",
        emailId: emailResponse.id
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
      
    } catch (emailError: any) {
      console.error("Error sending direct email with Resend:", emailError);
      throw emailError;
    }
  } catch (error: any) {
    console.error("Error in writer_direct_email handler:", error);
    return new Response(JSON.stringify({ 
      error: true, 
      message: error.message || "Failed to send email" 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
