
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('X-Signature');
    
    // Verify webhook signature
    const webhookSecret = Deno.env.get('LEMON_SQUEEZY_WEBHOOK_SECRET');
    if (webhookSecret && signature) {
      const hmac = createHmac('sha256', webhookSecret);
      hmac.update(body);
      const expectedSignature = hmac.digest('hex');
      
      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return new Response('Invalid signature', { status: 401 });
      }
    }

    const event = JSON.parse(body);
    console.log('Received Lemon Squeezy webhook:', event.meta.event_name);

    // Handle different event types
    switch (event.meta.event_name) {
      case 'order_created':
        await handleOrderCreated(supabaseClient, event);
        break;
      case 'order_refunded':
        await handleOrderRefunded(supabaseClient, event);
        break;
      default:
        console.log('Unhandled event type:', event.meta.event_name);
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Internal server error', { status: 500 });
  }
});

async function handleOrderCreated(supabase: any, event: any) {
  try {
    const order = event.data;
    const assignmentId = order.attributes.first_order_item?.product_name || 
                        order.attributes.custom_data?.assignment_id;

    if (!assignmentId) {
      console.error('No assignment ID found in order');
      return;
    }

    console.log('Processing payment for assignment:', assignmentId);

    // Update assignment as paid
    const { error: assignmentError } = await supabase
      .from('assignments')
      .update({
        paid: true,
        payment_date: new Date().toISOString()
      })
      .eq('id', assignmentId);

    if (assignmentError) {
      console.error('Error updating assignment:', assignmentError);
      return;
    }

    // Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        assignment_id: assignmentId,
        student_id: order.attributes.user_id,
        amount: parseFloat(order.attributes.total),
        status: 'completed',
        payment_method: 'lemon_squeezy',
        currency: order.attributes.currency,
        stripe_payment_intent_id: order.id // Using this field for Lemon Squeezy order ID
      });

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return;
    }

    console.log('Payment processed successfully for assignment:', assignmentId);

  } catch (error) {
    console.error('Error handling order created:', error);
  }
}

async function handleOrderRefunded(supabase: any, event: any) {
  try {
    const order = event.data;
    const assignmentId = order.attributes.first_order_item?.product_name || 
                        order.attributes.custom_data?.assignment_id;

    if (!assignmentId) {
      console.error('No assignment ID found in refunded order');
      return;
    }

    console.log('Processing refund for assignment:', assignmentId);

    // Update assignment payment status
    const { error: assignmentError } = await supabase
      .from('assignments')
      .update({
        paid: false,
        payment_date: null
      })
      .eq('id', assignmentId);

    if (assignmentError) {
      console.error('Error updating assignment for refund:', assignmentError);
      return;
    }

    // Update payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: 'refunded'
      })
      .eq('assignment_id', assignmentId)
      .eq('stripe_payment_intent_id', order.id);

    if (paymentError) {
      console.error('Error updating payment record for refund:', paymentError);
      return;
    }

    console.log('Refund processed successfully for assignment:', assignmentId);

  } catch (error) {
    console.error('Error handling order refunded:', error);
  }
}
