import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendQRCodeRequest {
  qrCode: string;
  partyName: string;
  friendName?: string;
  recipientEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { qrCode, partyName, friendName, recipientEmail }: SendQRCodeRequest = await req.json();

    console.log("Sending QR code email:", { partyName, friendName, recipientEmail });

    const emailResponse = await resend.emails.send({
      from: "Party Tickets <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `Your QR code for ${partyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Your Party Ticket QR Code</h1>
          
          <p>Hi${friendName ? ` ${friendName}` : ''},</p>
          
          <p>You've received a ticket for <strong>${partyName}</strong>!</p>
          
          <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px;">
            <h2 style="margin-top: 0;">Your QR Code</h2>
            <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block;">
              <p style="font-family: monospace; font-size: 12px; word-break: break-all; margin: 0;">
                ${qrCode}
              </p>
            </div>
            <p style="margin-bottom: 0; font-size: 14px; color: #666;">
              Save this QR code and show it at the party entrance
            </p>
          </div>
          
          <p><strong>Important:</strong> Please save this email and bring the QR code with you to the party. You can either show this email or screenshot the QR code.</p>
          
          <p>Have a great time at the party!</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #888;">
            This email was sent automatically. Please do not reply to this email.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-qr-code function:", error);
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