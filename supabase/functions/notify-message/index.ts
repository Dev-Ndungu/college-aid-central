
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

      // In a real application, you would send an email here
      console.log(`Sending email notification to ${student.email} about assignment taken by writer ${writer.full_name || writer.email}`);
      
      const emailSubject = `Your assignment "${assignment.title}" has been taken by a writer`;
      const emailBody = `
        Great news! Your assignment "${assignment.title}" has been taken by ${writer.full_name || writer.email}.
        
        You can now communicate directly with the writer through our messaging system.
        
        Assignment details:
        - Title: ${assignment.title}
        - Subject: ${assignment.subject}
        
        Login to track the progress of your assignment.
      `;
      
      console.log('Email Subject:', emailSubject);
      console.log('Email Body:', emailBody);
      
      // Here you would use an email service like SendGrid, Mailgun, etc.
    } 
    else if (payload.type === 'assignment_submitted') {
      // This is a new assignment notification for writers
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

      // In a real application, you would send an email to each writer
      for (const writer of writers) {
        console.log(`Sending email notification to writer ${writer.email} about new assignment`);
        
        const emailSubject = `New Assignment Available: "${assignment.title}"`;
        const emailBody = `
          A new assignment is available for you to take:
          
          Title: ${assignment.title}
          Subject: ${assignment.subject}
          
          Login to view more details and take this assignment.
        `;
        
        console.log('Email Subject:', emailSubject);
        console.log('Email Body:', emailBody);
        
        // Here you would use an email service like SendGrid, Mailgun, etc.
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
        // In a real application, you would integrate with an email service here
        // For this example, we'll just log the notification
        console.log(`Sending email notification to ${recipient.email} about new message from ${sender.email}`);
        
        // Example email content
        const emailSubject = `New Message from ${sender.full_name || sender.email}`;
        const emailBody = `
          You have received a new message from ${sender.full_name || sender.email}.
          
          Message: "${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}"
          
          Login to respond to this message.
        `;
        
        console.log('Email Subject:', emailSubject);
        console.log('Email Body:', emailBody);
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
