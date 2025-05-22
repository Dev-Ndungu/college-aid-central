
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Resend client with the API key
const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

serve(async (req) => {
  console.log('📨 Notification endpoint called. Method:', req.method);
  console.log('Full request URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request (CORS preflight)');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    
    console.log('Creating Supabase client with URL:', supabaseUrl ? 'URL exists' : 'URL missing');
    console.log('Service role key exists:', supabaseServiceKey ? 'Yes' : 'No');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and log the full request payload
    const rawPayload = await req.text();
    console.log('Raw request payload:', rawPayload);
    
    // Parse the payload into JSON
    const payload = JSON.parse(rawPayload);
    console.log('Request payload type:', payload.type);
    console.log('Full payload:', JSON.stringify(payload));
    
    // Handle different types of notifications
    if (payload.type === 'writer_direct_email') {
      // This is a direct email from writer to student
      const { recipient, sender, assignment, message } = payload;
      console.log('Processing writer_direct_email. Recipient:', recipient.email);
      
      if (!recipient || !recipient.email) {
        console.error('No recipient email provided');
        return new Response(
          JSON.stringify({ error: 'No recipient email provided' }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }
      
      // Use the custom sender name if provided, otherwise default to "Assignment Hub"
      const senderName = sender?.full_name || 'Assignment Hub';
      
      // Function to convert plain text URLs to HTML links
      const convertLinksToHtml = (text: string) => {
        // This regex will match http(s) URLs
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, '<a href="$1" style="color: #4338ca; text-decoration: underline;">$1</a>');
      };
      
      // Format email body with proper HTML formatting and convert URLs to clickable links
      const formattedBody = convertLinksToHtml(message.body.replace(/\n/g, '<br>'));
      
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4338ca;">Message from Assignment Hub</h2>
          <p>You have received a message regarding your assignment "${assignment.title}".</p>
          
          <div style="background-color: #f9fafb; border-left: 4px solid #4338ca; padding: 15px; margin: 20px 0;">
            <div style="margin-bottom: 10px;">
              ${formattedBody}
            </div>
          </div>
          
          <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            This is an automated message from Assignment Hub. You can reply to this email to communicate with your writer.
          </p>
        </div>
      `;
      
      console.log('Sending email to student:', recipient.email);
      
      try {
        // Send email using Resend
        const { data, error } = await resend.emails.send({
          from: 'Assignment Hub <info@assignmenthub.org>',
          to: [recipient.email],
          subject: message.subject,
          html: emailBody,
          reply_to: sender.email,
        });

        if (error) {
          console.error('Error sending direct email with Resend:', error);
          throw error;
        } else {
          console.log('Direct email sent successfully with Resend:', data);
        }
        
        return new Response(
          JSON.stringify({ success: true, data }),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      } catch (emailError) {
        console.error('Exception sending direct email with Resend:', emailError);
        throw emailError;
      }
    }
    else if (payload.type === 'assignment_taken') {
      // This is an assignment update notification
      const { assignment, writer } = payload;
      console.log('Processing assignment_taken notification. Assignment ID:', assignment.id);
      
      // Get the student details - first check if we have user_id
      if (!assignment.user_id) {
        return new Response(
          JSON.stringify({ warning: 'No user_id associated with this assignment' }),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }
      
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

      console.log('Found student:', student.email);

      // Get writer profile if writer object is not provided
      let writerInfo = writer;
      if (!writerInfo && assignment.writer_id) {
        const { data: writerData, error: writerError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', assignment.writer_id)
          .single();
          
        if (writerError) {
          console.error('Error fetching writer:', writerError);
        } else {
          writerInfo = writerData;
        }
      }
      
      const writerName = writerInfo?.full_name || (writerInfo?.email ? writerInfo.email.split('@')[0] : 'a writer');

      const emailSubject = `Your assignment "${assignment.title}" has been taken by a writer`;
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4338ca;">Great news!</h2>
          <p>Your assignment <strong>"${assignment.title}"</strong> has been taken by ${writerName}.</p>
          
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
            This is an automated message from Assignment Hub. Please do not reply directly to this email.
          </p>
        </div>
      `;
      
      console.log('Sending email to student:', student.email);
      console.log('Using Resend API key:', Deno.env.get('RESEND_API_KEY') ? 'API key exists' : 'API key missing');
      
      try {
        // Send email using Resend
        const { data, error } = await resend.emails.send({
          from: 'Assignment Hub <info@assignmenthub.org>',
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
      // This is a new assignment notification for writers
      const { assignment } = payload;
      console.log('Processing assignment_submitted notification. Assignment title:', assignment.title);
      
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

      console.log(`Found ${writers?.length || 0} writers to notify about new assignment`);
      
      if (!writers || writers.length === 0) {
        console.log('No writers found in the database! Cannot send notifications.');
        return new Response(
          JSON.stringify({ warning: 'No writers found to notify' }),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      const emailSubject = `📚 New Assignment Alert: "${assignment.title}"`;
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
            This is an automated message from Assignment Hub. Please do not reply directly to this email.
          </p>
        </div>
      `;
      
      // Log the Resend API key status
      console.log('Using Resend API key:', Deno.env.get('RESEND_API_KEY') ? 'API key exists' : 'API key missing');
      
      // Send emails to all writers with enhanced logging
      let successCount = 0;
      let failureCount = 0;
      
      for (const writer of writers || []) {
        console.log(`Sending email to writer ${writer.email} about new assignment`);
        
        try {
          // Send email using Resend with updated "from" address
          const { data, error } = await resend.emails.send({
            from: 'Assignment Hub <info@assignmenthub.org>',
            to: [writer.email],
            subject: emailSubject,
            html: emailBody,
          });

          if (error) {
            console.error(`Error sending email to writer ${writer.email}:`, error);
            failureCount++;
          } else {
            console.log(`Email sent successfully to writer ${writer.email}:`, data);
            successCount++;
          }
        } catch (emailError) {
          console.error(`Exception sending email to writer ${writer.email}:`, emailError);
          failureCount++;
        }
      }
      
      console.log(`Email sending summary: ${successCount} successful, ${failureCount} failed`);
    }
    else if (payload.type === 'assignment_status_update') {
      // This is a status update notification for students
      const { assignment, status, writer } = payload;
      console.log('Processing assignment_status_update notification. Assignment ID:', assignment.id);
      
      if (!assignment.user_id) {
        console.log('No user_id associated with this assignment, cannot send notification');
        return new Response(
          JSON.stringify({ warning: 'No student associated with this assignment' }),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }
      
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

      console.log('Found student:', student.email);
      
      // Get writer profile if writer object is not provided
      let writerInfo = writer;
      if (!writerInfo && assignment.writer_id) {
        const { data: writerData, error: writerError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', assignment.writer_id)
          .single();
          
        if (writerError) {
          console.error('Error fetching writer:', writerError);
        } else {
          writerInfo = writerData;
        }
      }
      
      // Different subject and content based on status
      let emailSubject = '';
      let statusMessage = '';
      let statusColor = '';
      
      switch(status) {
        case 'in_progress':
          emailSubject = `Your assignment "${assignment.title}" is in progress`;
          statusMessage = 'Your writer has started working on your assignment.';
          statusColor = '#3b82f6'; // blue
          break;
        case 'almost_done':
          emailSubject = `Your assignment "${assignment.title}" is almost complete`;
          statusMessage = 'Your assignment is nearly finished! The writer is putting the final touches on it.';
          statusColor = '#10b981'; // green
          break;
        case 'completed':
          emailSubject = `Your assignment "${assignment.title}" is complete`;
          statusMessage = 'Great news! Your assignment has been completed.';
          statusColor = '#6d28d9'; // purple
          break;
        default:
          emailSubject = `Update on your assignment "${assignment.title}"`;
          statusMessage = 'There has been an update to your assignment.';
          statusColor = '#4338ca'; // indigo
      }

      const writerName = writerInfo?.full_name || (writerInfo?.email ? writerInfo.email.split('@')[0] : 'Your writer');
      
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: ${statusColor};">Assignment Update</h2>
          
          <p>${statusMessage}</p>
          
          <div style="background-color: #f9fafb; border-left: 4px solid ${statusColor}; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${assignment.title}</h3>
            <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${status.replace('_', ' ')}</span></p>
            <p><strong>Writer:</strong> ${writerName}</p>
            <p><strong>Subject:</strong> ${assignment.subject}</p>
          </div>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${supabaseUrl.replace('.supabase.co', '')}/assignment-chat/${assignment.id}" 
               style="background-color: ${statusColor}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              Chat With Your Writer
            </a>
          </div>
          
          <p>Login to check the details and communicate with your writer.</p>
          
          <p style="color: #6b7280; font-size: 0.9em; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
            This is an automated message from Assignment Hub. Please do not reply directly to this email.
          </p>
        </div>
      `;
      
      console.log('Sending status update email to student:', student.email);
      
      try {
        // Send email using Resend
        const { data, error } = await resend.emails.send({
          from: 'Assignment Hub <info@assignmenthub.org>',
          to: [student.email],
          subject: emailSubject,
          html: emailBody,
        });

        if (error) {
          console.error('Error sending status update email with Resend:', error);
        } else {
          console.log('Status update email sent successfully with Resend:', data);
        }
      } catch (emailError) {
        console.error('Exception sending status update email with Resend:', emailError);
      }
    }
    else {
      // This is an unknown notification type
      console.error('Unknown notification type:', payload.type);
      return new Response(
        JSON.stringify({ error: 'Unknown notification type' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log('Notification processing completed successfully');
    return new Response(
      JSON.stringify({ success: true, message: `Notification processed successfully` }),
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
