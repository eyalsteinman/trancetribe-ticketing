import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting expired offers cleanup...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Call the existing database function to expire old offers
    const { error: rpcError } = await supabase.rpc('expire_old_offers');

    if (rpcError) {
      console.error('Error calling expire_old_offers:', rpcError);
      throw rpcError;
    }

    // Get count of expired offers for logging
    const { count, error: countError } = await supabase
      .from('admin_offers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'expired');

    if (countError) {
      console.error('Error getting expired offers count:', countError);
    }

    console.log(`Cleanup complete. Total expired offers in system: ${count || 0}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Expired offers cleanup completed',
        totalExpiredOffers: count || 0
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Error in cleanup-expired-offers function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
