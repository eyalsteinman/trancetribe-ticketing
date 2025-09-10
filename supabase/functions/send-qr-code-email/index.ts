import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { QRCodeEmail } from './_templates/qr-code-email.tsx';

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

    console.log("QR code email sent successfully:", emailResponse);

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