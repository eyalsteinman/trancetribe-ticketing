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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Calculate the date 12 hours ago  
    const twelveHoursAgo = new Date();
    twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);

    console.log('Cleaning up parties that ended before:', twelveHoursAgo.toISOString());

    // Delete parties that ended more than 12 hours ago
    const { error, count } = await supabase
      .from('parties')
      .delete()
      .lt('date', twelveHoursAgo.toISOString().split('T')[0]);

    if (error) {
      console.error('Error deleting ended parties:', error);
      throw error;
    }

    console.log(`Successfully deleted ${count || 0} ended parties`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Deleted ${count || 0} ended parties`,
        deletedCount: count || 0
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in cleanup-ended-parties function:', error);
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