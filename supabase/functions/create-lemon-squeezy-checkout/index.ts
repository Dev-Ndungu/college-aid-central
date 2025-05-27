
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
    console.log('Dynamic price from writer:', price);

    // Get Lemon Squeezy credentials
    const apiKey = Deno.env.get('LEMON_SQUEEZY_API_KEY');
    const storeId = '184716'; // Your correct Store ID

    if (!apiKey) {
      throw new Error('Lemon Squeezy API key not configured');
    }

    console.log('Using store ID:', storeId);

    // First, verify the store exists by fetching store details
    const storeResponse = await fetch(`https://api.lemonsqueezy.com/v1/stores/${storeId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/vnd.api+json'
      }
    });

    if (!storeResponse.ok) {
      const errorText = await storeResponse.text();
      console.error('Store not found:', storeResponse.status, errorText);
      throw new Error(`Store ID ${storeId} not found. Please check your store ID in Lemon Squeezy dashboard.`);
    }

    const storeData = await storeResponse.json();
    console.log('Store verified:', storeData.data.attributes.name);

    // Get products for this specific store
    const productsResponse = await fetch(`https://api.lemonsqueezy.com/v1/products?filter[store_id]=${storeId}`, {
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
    console.log('Available products for store:', productsData.data?.length || 0);

    if (!productsData.data || productsData.data.length === 0) {
      throw new Error(`No products found in store ${storeId}. Please create a product in your Lemon Squeezy store first.`);
    }

    // Get variants for the first available product
    let variantId = null;
    const firstProduct = productsData.data[0];
    console.log('Using product:', firstProduct.id, firstProduct.attributes.name);

    const variantsResponse = await fetch(`https://api.lemonsqueezy.com/v1/variants?filter[product_id]=${firstProduct.id}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/vnd.api+json'
      }
    });

    if (variantsResponse.ok) {
      const variantsData = await variantsResponse.json();
      console.log('Available variants:', variantsData.data?.length || 0);
      
      if (variantsData.data && variantsData.data.length > 0) {
        variantId = variantsData.data[0].id;
        console.log('Using variant ID:', variantId);
      }
    }

    if (!variantId) {
      throw new Error('No variants found. Please ensure your product has at least one variant.');
    }

    // Create checkout session with dynamic pricing - this will override the product's default price
    const priceInCents = Math.round(price * 100); // Convert dollars to cents
    console.log('Setting dynamic price:', `$${price} = ${priceInCents} cents`);

    const checkoutData = {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: studentEmail || '',
            custom: {
              assignment_id: assignmentId,
              assignment_title: assignmentTitle,
              writer_price: price
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
            description: `Assignment: ${assignmentTitle} - Writer Price: $${price}`,
            price: priceInCents // This is the key - it overrides the default product price with your custom price
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

    console.log('Creating checkout with dynamic price of $' + price);

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
    console.log('Checkout session created successfully with dynamic price!');

    return new Response(
      JSON.stringify({ 
        checkoutUrl: checkoutSession.data.attributes.url,
        checkoutId: checkoutSession.data.id,
        price: price,
        priceInCents: priceInCents
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
        troubleshooting: {
          step1: 'Verify your Store ID in Lemon Squeezy Dashboard > Settings',
          step2: 'Ensure you have at least one published product',
          step3: 'Check your API key has the correct permissions'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
