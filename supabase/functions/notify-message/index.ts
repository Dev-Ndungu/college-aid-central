
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Resend client with the API key
const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// Custom email configuration
const FROM_EMAIL = 'Assignment Hub <notifications@yourdomain.com>'; // Replace with your actual domain

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    
    // Handle different types of notifications
    if (payload.type === 'assignment_taken') {
      // This is an assignment update notification
      const { assignment, writer } = payload;
      
      // Get the student details
      const { data: student, error: studentError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', assignment.user_id)
        .single();

      if (studentError || !student) {
        console.error('Error fetching student:', studentError);
        return new Response(
          JSON.stringify({ error: 'Student not found' }),
          { 
            status: 404, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      const emailSubject = `Your assignment "${assignment.title}" has been taken by a writer`;
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4338ca;">Great news!</h2>
          <p>Your assignment <strong>"${assignment.title}"</strong> has been taken by ${writer.full_name || writer.email}.</p>
          
          <p>You can now communicate directly with the writer through our messaging system.</p>
          
          <h3>Assignment details:</h3>
          <ul>
            <li><strong>Title:</strong> ${assignment.title}</li>
            <li><strong>Subject:</strong> ${assignment.subject}</li>
          </ul>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${supabaseUrl.replace('.supabase.co', '')}/assignment-chat/${assignment.id}" 
               style="background-color: #4338ca; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              Start Chatting With Your Writer
            </a>
          </div>
          
          <p>Login to track the progress of your assignment.</p>
          
          <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            This is an automated message from College Aid Central. Please do not reply directly to this email.
          </p>
        </div>
      `;
      
      console.log('Sending email to student:', student.email);
      
      try {
        // Send email using Resend with custom from address
        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: [student.email],
          subject: emailSubject,
          html: emailBody,
        });

        if (error) {
          console.error('Error sending email with Resend:', error);
        } else {
          console.log('Email sent successfully with Resend:', data);
        }
      } catch (emailError) {
        console.error('Exception sending email with Resend:', emailError);
      }
      
    } 
    else if (payload.type === 'assignment_submitted') {
      // This is a new assignment notification for writers and admin
      const { assignment } = payload;
      
      // Get all writers
      const { data: writers, error: writersError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('role', 'writer');

      if (writersError) {
        console.error('Error fetching writers:', writersError);
        return new Response(
          JSON.stringify({ error: 'Writers not found' }),
          { 
            status: 404, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      const emailSubject = `New Assignment Available: "${assignment.title}"`;
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4338ca;">New Assignment Available</h2>
          <p>A new assignment is available for you to take:</p>
          
          <div style="background-color: #f9fafb; border-left: 4px solid #4338ca; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${assignment.title}</h3>
            <p><strong>Subject:</strong> ${assignment.subject}</p>
            <p><strong>Description:</strong> ${assignment.description || 'No description provided.'}</p>
          </div>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${supabaseUrl.replace('.supabase.co', '')}/dashboard" 
               style="background-color: #4338ca; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              View Assignment Details
            </a>
          </div>
          
          <p>Login to view more details and take this assignment.</p>
          
          <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            This is an automated message from College Aid Central. Please do not reply directly to this email.
          </p>
        </div>
      `;

      // Send to all writers
      for (const writer of writers) {
        console.log(`Sending email to writer ${writer.email} about new assignment`);
        
        try {
          // Send email using Resend with custom from address
          const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: [writer.email],
            subject: emailSubject,
            html: emailBody,
          });

          if (error) {
            console.error(`Error sending email to writer ${writer.email}:`, error);
          } else {
            console.log(`Email sent successfully to writer ${writer.email}:`, data);
          }
        } catch (emailError) {
          console.error(`Exception sending email to writer ${writer.email}:`, emailError);
        }
      }
      
      // Send notification to admin as well (you)
      const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'your-admin-email@yourdomain.com'; // Replace with actual admin email
      try {
        const adminSubject = `New Assignment Submitted: "${assignment.title}"`;
        const adminEmailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4338ca;">New Assignment Submitted</h2>
            <p>A student has submitted a new assignment:</p>
            
            <div style="background-color: #f9fafb; border-left: 4px solid #4338ca; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0;">${assignment.title}</h3>
              <p><strong>Subject:</strong> ${assignment.subject}</p>
              <p><strong>Description:</strong> ${assignment.description || 'No description provided.'}</p>
              <p><strong>Student Name:</strong> ${assignment.student_name || 'Not provided'}</p>
              <p><strong>Student Email:</strong> ${assignment.student_email || 'Not provided'}</p>
            </div>
            
            <div style="margin: 30px 0; text-align: center;">
              <a href="${supabaseUrl.replace('.supabase.co', '')}/dashboard" 
                 style="background-color: #4338ca; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                View Assignment Details
              </a>
            </div>
          </div>
        `;
        
        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: [adminEmail],
          subject: adminSubject,
          html: adminEmailBody,
        });

        if (error) {
          console.error('Error sending admin notification email:', error);
        } else {
          console.log('Admin notification email sent successfully:', data);
        }
      } catch (emailError) {
        console.error('Exception sending admin notification email:', emailError);
      }
    }
    else if (payload.type === 'assignment_updated') {
      // This is a notification for when a writer updates an assignment
      const { assignment, updates } = payload;
      
      // Get the student details
      const { data: student, error: studentError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', assignment.user_id)
        .single();

      if (studentError || !student) {
        console.error('Error fetching student:', studentError);
        return new Response(
          JSON.stringify({ error: 'Student not found' }),
          { 
            status: 404, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      // Create a user-friendly update message
      let updateDetails = '';
      if (updates.progress !== undefined) {
        updateDetails += `<li><strong>Progress updated:</strong> ${updates.progress}%</li>`;
      }
      if (updates.status !== undefined) {
        updateDetails += `<li><strong>Status changed to:</strong> ${updates.status}</li>`;
      }
      if (updates.due_date !== undefined) {
        const formattedDate = new Date(updates.due_date).toLocaleDateString();
        updateDetails += `<li><strong>Due date updated:</strong> ${formattedDate}</li>`;
      }
      // Add other update types as needed
      
      if (!updateDetails) {
        updateDetails = '<li>Your assignment has been updated.</li>';
      }

      const emailSubject = `Update on your assignment: "${assignment.title}"`;
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4338ca;">Assignment Update</h2>
          <p>Your assignment <strong>"${assignment.title}"</strong> has been updated.</p>
          
          <h3>Updates:</h3>
          <ul>
            ${updateDetails}
          </ul>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${supabaseUrl.replace('.supabase.co', '')}/assignment-chat/${assignment.id}" 
               style="background-color: #4338ca; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              View Assignment Details
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            This is an automated message from College Aid Central. Please do not reply directly to this email.
          </p>
        </div>
      `;
      
      console.log('Sending update email to student:', student.email);
      
      try {
        // Send email using Resend with custom from address
        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: [student.email],
          subject: emailSubject,
          html: emailBody,
        });

        if (error) {
          console.error('Error sending update email with Resend:', error);
        } else {
          console.log('Update email sent successfully with Resend:', data);
        }
      } catch (emailError) {
        console.error('Exception sending update email with Resend:', emailError);
      }
    }
    else {
      // This is a message notification (original functionality)
      const message = payload.record;

      if (!message || !message.recipient_id) {
        return new Response(
          JSON.stringify({ error: 'Invalid message payload' }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      // Get the recipient details
      const { data: recipient, error: recipientError } = await supabase
        .from('profiles')
        .select('email, role')
        .eq('id', message.recipient_id)
        .single();

      if (recipientError || !recipient) {
        console.error('Error fetching recipient:', recipientError);
        return new Response(
          JSON.stringify({ error: 'Recipient not found' }),
          { 
            status: 404, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      // Get the sender details
      const { data: sender, error: senderError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', message.sender_id)
        .single();

      if (senderError || !sender) {
        console.error('Error fetching sender:', senderError);
        return new Response(
          JSON.stringify({ error: 'Sender not found' }),
          { 
            status: 404, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      // Only send email notifications to writers
      if (recipient.role === 'writer') {
        const emailSubject = `New Message from ${sender.full_name || sender.email}`;
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4338ca;">You have a new message</h2>
            <p>You have received a new message from <strong>${sender.full_name || sender.email}</strong>.</p>
            
            <div style="background-color: #f9fafb; border-left: 4px solid #4338ca; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-style: italic;">"${message.content.substring(0, 150)}${message.content.length > 150 ? '...' : ''}"</p>
            </div>
            
            <div style="margin: 30px 0; text-align: center;">
              <a href="${supabaseUrl.replace('.supabase.co', '')}/messages" 
                 style="background-color: #4338ca; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                Respond to Message
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
              This is an automated message from College Aid Central. Please do not reply directly to this email.
            </p>
          </div>
        `;
        
        try {
          // Send email using Resend with custom from address
          const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: [recipient.email],
            subject: emailSubject,
            html: emailBody,
          });

          if (error) {
            console.error('Error sending message notification email:', error);
          } else {
            console.log('Message notification email sent successfully:', data);
          }
        } catch (emailError) {
          console.error('Exception sending message notification email:', emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error processing notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});
