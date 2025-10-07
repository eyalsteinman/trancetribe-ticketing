import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { QRCodeEmail } from './_templates/qr-code-email.tsx';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface QRCodeEmailRequest {
  to: string;
  qrCode: string;
  partyName: string;
  userName?: string;
  partyDate?: string;
  productionName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create authenticated Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { to, qrCode, partyName, userName, partyDate, productionName }: QRCodeEmailRequest = await req.json();

    if (!to || !qrCode || !partyName) {
      return new Response(
        JSON.stringify({ error: "Email, QR code, and party name are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify user owns this QR code
    const { data: qrData, error: qrError } = await supabaseClient
      .from('qr_codes')
      .select('user_id, code, party_id')
      .eq('code', qrCode)
      .single();

    if (qrError || !qrData) {
      console.error('QR code not found:', qrError);
      return new Response(
        JSON.stringify({ error: 'QR code not found' }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (qrData.user_id !== user.id) {
      console.error('User does not own this QR code');
      return new Response(
        JSON.stringify({ error: 'You do not have permission to send this QR code' }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Rate limiting - max 10 QR code emails per hour per user
    const hourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count, error: countError } = await supabaseClient
      .from('qr_codes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', hourAgo);

    if (!countError && count && count > 10) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded - maximum 10 QR code emails per hour' }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Render the React email template
    const html = await renderAsync(
      React.createElement(QRCodeEmail, {
        qrCode,
        partyName,
        userName,
        partyDate,
      })
    );

    const emailResponse = await resend.emails.send({
      from: "Party Admin <onboarding@resend.dev>",
      to: [to],
      subject: `Your QR Code for ${partyName}${productionName ? ` - ${productionName}` : ''}`,
      html,
    });

    console.log("QR code email sent successfully for user:", user.id, emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-qr-code-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);