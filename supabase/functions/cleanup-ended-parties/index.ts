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

    // Determine parties that ended more than 12 hours ago
    const now = new Date();
    const twelveHoursMs = 12 * 60 * 60 * 1000;

    const { data: parties, error: partiesError } = await supabase
      .from('parties')
      .select('id, date, end_time');

    if (partiesError) {
      console.error('Error loading parties for cleanup:', partiesError);
      throw partiesError;
    }

    const toDeleteIds = (parties || [])
      .filter((p: any) => {
        // Build end datetime using end_time when available; default to end of day
        const endTimeStr = p.end_time ? p.end_time : '23:59:59';
        const endAt = new Date(`${p.date}T${endTimeStr}`);
        return endAt.getTime() + twelveHoursMs < now.getTime();
      })
      .map((p: any) => p.id);

    console.log('Parties to delete (older than 12h after end):', toDeleteIds);

    if (toDeleteIds.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No parties to delete', deletedCount: 0 }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // Delete related QR codes first to avoid FK issues
    const { error: qrDelError } = await supabase
      .from('qr_codes')
      .delete()
      .in('party_id', toDeleteIds);

    if (qrDelError) {
      console.error('Error deleting related QR codes:', qrDelError);
      throw qrDelError;
    }

    const { error: deletePartiesError } = await supabase
      .from('parties')
      .delete()
      .in('id', toDeleteIds);

    if (deletePartiesError) {
      console.error('Error deleting ended parties:', deletePartiesError);
      throw deletePartiesError;
    }

    return new Response(
      JSON.stringify({ success: true, message: `Deleted ${toDeleteIds.length} ended parties`, deletedCount: toDeleteIds.length }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
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