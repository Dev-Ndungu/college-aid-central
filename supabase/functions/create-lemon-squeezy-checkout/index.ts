
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

    console.log('Using store ID:', storeId);

    // First, let's get available products and variants
    const productsResponse = await fetch('https://api.lemonsqueezy.com/v1/products', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/vnd.api+json'
      }
    });

    if (!productsResponse.ok) {
      const errorText = await productsResponse.text();
      console.error('Error fetching products:', productsResponse.status, errorText);
      throw new Error(`Failed to fetch products: ${productsResponse.status}`);
    }

    const productsData = await productsResponse.json();
    console.log('Available products:', JSON.stringify(productsData, null, 2));

    // Get variants for the first available product
    let variantId = null;
    if (productsData.data && productsData.data.length > 0) {
      const firstProduct = productsData.data[0];
      console.log('Using product:', firstProduct.id);

      const variantsResponse = await fetch(`https://api.lemonsqueezy.com/v1/variants?filter[product_id]=${firstProduct.id}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/vnd.api+json'
        }
      });

      if (variantsResponse.ok) {
        const variantsData = await variantsResponse.json();
        console.log('Available variants:', JSON.stringify(variantsData, null, 2));
        
        if (variantsData.data && variantsData.data.length > 0) {
          variantId = variantsData.data[0].id;
          console.log('Using variant ID:', variantId);
        }
      }
    }

    if (!variantId) {
      throw new Error('No products or variants found. Please create a product in your Lemon Squeezy store first.');
    }

    // Create checkout session with Lemon Squeezy
    const checkoutData = {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: studentEmail || '',
            custom: {
              assignment_id: assignmentId,
              assignment_title: assignmentTitle
            }
          },
          checkout_options: {
            embed: false,
            media: false,
            logo: true
          },
          product_options: {
            enabled_variants: [variantId],
            redirect_url: `${req.headers.get('origin')}/dashboard?payment=success&assignment=${assignmentId}`,
            receipt_link_url: `${req.headers.get('origin')}/dashboard`,
            receipt_thank_you_note: 'Thank you for your payment! Your assignment will be processed shortly.',
            receipt_button_text: 'Go to Dashboard',
            name: assignmentTitle,
            description: `Assignment: ${assignmentTitle}`,
            price: Math.round(price * 100) // Convert to cents
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
              id: variantId
            }
          }
        }
      }
    };

    console.log('Creating checkout with data:', JSON.stringify(checkoutData, null, 2));

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
      throw new Error(`Lemon Squeezy API error: ${response.status} - ${errorText}`);
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
      JSON.stringify({ 
        error: error.message,
        details: 'Make sure you have created at least one product with a variant in your Lemon Squeezy store.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
