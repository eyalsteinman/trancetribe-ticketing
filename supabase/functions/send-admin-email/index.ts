import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  message: string;
  fromEmail: string;
  fromName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, message, fromEmail, fromName }: EmailRequest = await req.json();

    if (!to || !subject || !message || !fromEmail) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const mailtrapApiKey = Deno.env.get("MAILTRAP_API_KEY");
    if (!mailtrapApiKey) {
      return new Response(
        JSON.stringify({ error: "Mailtrap API key not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const emailPayload = {
      from: {
        email: fromEmail,
        name: fromName || "Admin"
      },
      to: [
        {
          email: to
        }
      ],
      subject: subject,
      text: message,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2563eb;">${subject}</h2>
        <div style="white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</div>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          This email was sent by ${fromName || "Admin"} (${fromEmail})
        </p>
      </div>`
    };

    console.log("Sending email via Mailtrap:", { to, subject, fromEmail });

    const response = await fetch("https://send.api.mailtrap.io/api/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mailtrapApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const responseData = await response.json();
    console.log("Mailtrap response:", responseData);

    if (!response.ok) {
      throw new Error(`Mailtrap API error: ${JSON.stringify(responseData)}`);
    }

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-admin-email function:", error);
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