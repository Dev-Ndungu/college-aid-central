
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

    // This is a database webhook that will receive the new message
    const payload = await req.json();
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
      
      // Here you would use an email service like SendGrid, Mailgun, etc.
      // For now, we'll just simulate a successful email send
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error processing message notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});
