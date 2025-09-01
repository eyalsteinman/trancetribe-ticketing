import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import React from 'npm:react@18.3.1'

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface QRCodeEmailRequest {
  qrCodeId: string;
}

const QRCodeEmail = ({ 
  qrCode, 
  userEmail, 
  userName, 
  partyName, 
  partyDate 
}: {
  qrCode: string;
  userEmail: string;
  userName: string;
  partyName: string;
  partyDate: string;
}) => {
  return React.createElement('div', { style: { fontFamily: 'Arial, sans-serif' } }, [
    React.createElement('h1', { key: 'title' }, `Your QR Code for ${partyName}`),
    React.createElement('p', { key: 'greeting' }, `Hi ${userName},`),
    React.createElement('p', { key: 'message' }, 
      `Your QR code for ${partyName} on ${partyDate} has been approved! Show this QR code at the entrance.`
    ),
    React.createElement('div', {
      key: 'qr',
      style: {
        textAlign: 'center',
        margin: '20px 0',
        padding: '20px',
        backgroundColor: '#f9f9f9'
      }
    }, [
      React.createElement('p', { key: 'qr-text' }, 'Your QR Code:'),
      React.createElement('p', { 
        key: 'qr-code',
        style: { 
          fontSize: '24px', 
          fontWeight: 'bold', 
          fontFamily: 'monospace',
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ddd'
        } 
      }, qrCode)
    ]),
    React.createElement('p', { key: 'footer' }, 'See you at the party!'),
    React.createElement('p', { key: 'signature' }, 'Best regards,\nTrance Tribe Team')
  ]);
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { qrCodeId }: QRCodeEmailRequest = await req.json();

    if (!qrCodeId) {
      return new Response(
        JSON.stringify({ error: "QR code ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get QR code details with user and party info
    const { data: qrData, error: qrError } = await supabase
      .from('qr_codes')
      .select(`
        *,
        parties (
          name,
          date
        ),
        profiles!qr_codes_user_id_fkey (
          email,
          display_name,
          first_name,
          last_name
        )
      `)
      .eq('id', qrCodeId)
      .eq('is_approved', true)
      .single();

    if (qrError || !qrData) {
      return new Response(
        JSON.stringify({ error: "QR code not found or not approved" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const userEmail = qrData.profiles?.email;
    const userName = qrData.profiles?.display_name || 
                    `${qrData.profiles?.first_name || ''} ${qrData.profiles?.last_name || ''}`.trim() ||
                    'User';
    const partyName = qrData.parties?.name || 'Unknown Party';
    const partyDate = qrData.parties?.date ? 
                     new Date(qrData.parties.date).toLocaleDateString('en-GB', { 
                       day: 'numeric', 
                       month: 'long', 
                       year: 'numeric' 
                     }) : 'Unknown Date';

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Render email HTML
    const html = await renderAsync(
      React.createElement(QRCodeEmail, {
        qrCode: qrData.code,
        userEmail,
        userName,
        partyName,
        partyDate
      })
    );

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Trance Tribe <no-reply@trancetribe.com>",
      to: [userEmail],
      subject: `Your QR Code for ${partyName} is Ready!`,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id,
      sentTo: userEmail 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-qr-email-on-approval function:", error);
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