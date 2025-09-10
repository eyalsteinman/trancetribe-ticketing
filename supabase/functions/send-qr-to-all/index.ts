import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import QRCode from "https://esm.sh/qrcode@1.5.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { party_id, guest_list } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get party information
    const { data: party, error: partyError } = await supabase
      .from('parties')
      .select('name')
      .eq('id', party_id)
      .single();

    if (partyError) throw partyError;

    // Send QR message to each guest
    for (const guest of guest_list) {
      try {
        // Generate QR code as base64 image
        const qrCode = await QRCode.toDataURL(guest.id, {
          type: 'image/jpeg',
          quality: 0.8,
          margin: 1,
          width: 256
        });

        // Create message with QR code
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            subject: `Your QR Code for ${party.name}`,
            content: `Here is your QR code for the party "${party.name}". Please present this at the entrance.\n\nQR Code: ${qrCode}`,
            created_by: '00000000-0000-0000-0000-000000000000', // System message
            recipient_id: guest.user_id,
            production_id: null
          });

        if (messageError) {
          console.error(`Failed to send QR to user ${guest.user_id}:`, messageError);
        }
      } catch (error) {
        console.error(`Error processing guest ${guest.user_id}:`, error);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});