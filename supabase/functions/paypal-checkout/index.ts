import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PayPalOrderRequest {
  amount: number;
  currency: string;
  adminId: string;
  partyId?: string;
  ticketTypeId?: string;
}

interface PayPalAccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PayPalOrderResponse {
  id: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

async function getPayPalAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const auth = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`PayPal auth failed: ${response.status} ${response.statusText}`);
  }

  const data: PayPalAccessTokenResponse = await response.json();
  return data.access_token;
}

async function createPayPalOrder(
  accessToken: string,
  amount: number,
  currency: string
): Promise<PayPalOrderResponse> {
  const orderData = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: currency.toUpperCase(),
          value: amount.toFixed(2),
        },
        description: 'Event Ticket Purchase',
      },
    ],
    payment_source: {
      paypal: {
        experience_context: {
          payment_method_preference: 'UNRESTRICTED',
          brand_name: 'Event Hub',
          locale: 'en-US',
          landing_page: 'LOGIN',
          user_action: 'PAY_NOW',
        },
      },
    },
  };

  const response = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayPal order creation failed: ${response.status} ${errorText}`);
  }

  return await response.json();
}

async function getAdminPayPalCredentials(adminId: string) {
  // For now, use default credentials from secrets
  // In the future, this could be extended to fetch admin-specific credentials from database
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured for this admin');
  }
  
  return { clientId, clientSecret };
}

const handler = async (req: Request): Promise<Response> => {
  console.log('PayPal checkout function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const { amount, currency = 'ILS', adminId, partyId, ticketTypeId }: PayPalOrderRequest = await req.json();
    
    console.log('Request data:', { amount, currency, adminId, partyId, ticketTypeId });

    // Validate required fields
    if (!amount || !adminId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: amount, adminId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Amount must be greater than 0' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get PayPal credentials for the specific admin
    const { clientId, clientSecret } = await getAdminPayPalCredentials(adminId);
    
    // Get PayPal access token
    console.log('Getting PayPal access token...');
    const accessToken = await getPayPalAccessToken(clientId, clientSecret);
    
    // Create PayPal order
    console.log('Creating PayPal order...');
    const order = await createPayPalOrder(accessToken, amount, currency);
    
    console.log('PayPal order created successfully:', order.id);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create payment record in database
    const { error: dbError } = await supabase
      .from('payments')
      .insert({
        user_id: null, // Will be updated when payment is completed
        party_id: partyId,
        amount: amount,
        currency: currency.toLowerCase(),
        status: 'pending',
        stripe_session_id: order.id, // Reusing this field for PayPal order ID
      });

    if (dbError) {
      console.error('Database error:', dbError);
      // Continue anyway, as the PayPal order was created successfully
    }

    return new Response(
      JSON.stringify({
        orderId: order.id,
        status: order.status,
        approveUrl: order.links.find(link => link.rel === 'approve')?.href,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in paypal-checkout function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);