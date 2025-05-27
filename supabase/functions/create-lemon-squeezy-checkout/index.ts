
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CheckoutRequest {
  assignmentId: string;
  price: number;
  assignmentTitle: string;
  studentEmail?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { assignmentId, price, assignmentTitle, studentEmail } = await req.json() as CheckoutRequest;

    console.log('Creating Lemon Squeezy checkout for assignment:', assignmentId);

    // Get Lemon Squeezy credentials
    const apiKey = Deno.env.get('LEMON_SQUEEZY_API_KEY');
    const storeId = Deno.env.get('LEMON_SQUEEZY_STORE_ID');

    if (!apiKey || !storeId) {
      throw new Error('Lemon Squeezy credentials not configured');
    }

    // Create checkout session with Lemon Squeezy
    const checkoutData = {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: studentEmail || '',
            custom: {
              assignment_id: assignmentId
            }
          },
          checkout_options: {
            embed: false,
            media: false,
            logo: true
          },
          product_options: {
            enabled_variants: [],
            redirect_url: `${req.headers.get('origin')}/dashboard?payment=success&assignment=${assignmentId}`,
            receipt_link_url: `${req.headers.get('origin')}/dashboard`,
            receipt_thank_you_note: 'Thank you for your payment! Your assignment will be processed shortly.',
            receipt_button_text: 'Go to Dashboard'
          },
          test_mode: true // Set to false for production
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: storeId
            }
          },
          variant: {
            data: {
              type: 'variants',
              id: '1' // You'll need to create a variant in Lemon Squeezy for your assignment service
            }
          }
        }
      }
    };

    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json'
      },
      body: JSON.stringify(checkoutData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lemon Squeezy API error:', response.status, errorText);
      throw new Error(`Lemon Squeezy API error: ${response.status}`);
    }

    const checkoutSession = await response.json();
    console.log('Checkout session created:', checkoutSession.data.id);

    return new Response(
      JSON.stringify({ 
        checkoutUrl: checkoutSession.data.attributes.url,
        checkoutId: checkoutSession.data.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error creating checkout:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
