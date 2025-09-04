import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// React Email Template
const QRCodeApprovalEmail = ({
  qrCode,
  partyName,
  userName,
  partyDate,
  adminEmail,
}: {
  qrCode: string;
  partyName: string;
  userName?: string;
  partyDate?: string;
  adminEmail: string;
}) => {
  return React.createElement(
    "html",
    {},
    React.createElement(
      "head",
      {},
      React.createElement("title", {}, "Your QR Code is Ready!")
    ),
    React.createElement(
      "body",
      { style: { fontFamily: "Arial, sans-serif", margin: 0, padding: "20px", backgroundColor: "#f5f5f5" } },
      React.createElement(
        "div",
        { style: { maxWidth: "600px", margin: "0 auto", backgroundColor: "white", padding: "30px", borderRadius: "10px" } },
        React.createElement(
          "h1",
          { style: { color: "#2563eb", textAlign: "center", marginBottom: "30px" } },
          "🎉 Your QR Code is Ready!"
        ),
        React.createElement(
          "p",
          { style: { fontSize: "16px", lineHeight: "1.6", color: "#333" } },
          `Hi ${userName || "there"},`
        ),
        React.createElement(
          "p",
          { style: { fontSize: "16px", lineHeight: "1.6", color: "#333" } },
          `Great news! Your QR code for "${partyName}" has been approved and is now ready to use.`
        ),
        partyDate && React.createElement(
          "p",
          { style: { fontSize: "16px", lineHeight: "1.6", color: "#333" } },
          `Event Date: ${new Date(partyDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}`
        ),
        React.createElement(
          "div",
          { style: { textAlign: "center", margin: "30px 0", padding: "20px", backgroundColor: "#f8fafc", borderRadius: "8px" } },
          React.createElement(
            "div",
            { style: { display: "inline-block", padding: "20px", backgroundColor: "white", borderRadius: "8px" } },
            React.createElement("img", {
              src: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`,
              alt: "Your QR Code",
              style: { width: "200px", height: "200px" }
            })
          )
        ),
        React.createElement(
          "div",
          { style: { backgroundColor: "#dcfce7", padding: "15px", borderRadius: "8px", margin: "20px 0" } },
          React.createElement(
            "p",
            { style: { margin: 0, color: "#166534", fontWeight: "bold" } },
            "✅ Important: Show this QR code at the entrance to gain access to the event."
          )
        ),
        React.createElement(
          "p",
          { style: { fontSize: "14px", color: "#666", marginTop: "30px" } },
          `This email was sent by the admin: ${adminEmail}`
        ),
        React.createElement(
          "hr",
          { style: { margin: "30px 0", border: "none", borderTop: "1px solid #eee" } }
        ),
        React.createElement(
          "p",
          { style: { fontSize: "12px", color: "#999", textAlign: "center" } },
          "Trance Tribes Tickets - Created by Eyal Steinman, all rights reserved 2025"
        )
      )
    )
  );
};

interface QREmailRequest {
  qrCodeId: string;
  adminEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { qrCodeId, adminEmail }: QREmailRequest = await req.json();

    if (!qrCodeId || !adminEmail) {
      return new Response(
        JSON.stringify({ error: "QR code ID and admin email are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get QR code details with party and user information
    const { data: qrData, error: qrError } = await supabase
      .from('qr_codes')
      .select(`
        *,
        parties (
          name,
          date
        ),
        profiles!qr_codes_user_id_fkey (
          display_name,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', qrCodeId)
      .single();

    if (qrError || !qrData) {
      console.error('Error fetching QR code:', qrError);
      return new Response(
        JSON.stringify({ error: "QR code not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const userEmail = qrData.profiles?.email;
    const userName = qrData.profiles?.display_name || 
                    `${qrData.profiles?.first_name || ''} ${qrData.profiles?.last_name || ''}`.trim();
    const partyName = qrData.parties?.name || 'Unknown Event';
    const partyDate = qrData.parties?.date;

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Render the React email template
    const html = await renderAsync(
      React.createElement(QRCodeApprovalEmail, {
        qrCode: qrData.code,
        partyName,
        userName,
        partyDate,
        adminEmail,
      })
    );

    const emailResponse = await resend.emails.send({
      from: `${adminEmail} <onboarding@resend.dev>`,
      to: [userEmail],
      subject: `🎉 Your QR Code for ${partyName} is Ready!`,
      html,
    });

    console.log("QR approval email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      data: emailResponse,
      sentTo: userEmail 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-qr-email-with-admin function:", error);
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