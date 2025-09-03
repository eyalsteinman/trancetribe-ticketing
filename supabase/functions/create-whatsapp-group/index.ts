import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const whatsappToken = Deno.env.get("WHATSAPP_API_TOKEN");
const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateGroupRequest {
  partyName: string;
  partyDate: string;
  productionName: string;
  phoneNumbers: string[];
}

// Helper: normalize phone number to E.164 if possible (basic)
function normalizePhone(num: string): string {
  const digits = num.replace(/\D/g, "");
  if (digits.startsWith("+")) return digits;
  // If it already has country code (e.g. 972...), prefix '+'
  if (digits.length > 10) return `+${digits}`;
  // Naive IL example: local numbers starting with 0 -> +972
  if (digits.startsWith("0")) return `+972${digits.slice(1)}`;
  return `+${digits}`;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { partyName, partyDate, productionName, phoneNumbers }: CreateGroupRequest = await req.json();

    if (!partyName || !partyDate || !productionName || !phoneNumbers || phoneNumbers.length === 0) {
      return new Response(
        JSON.stringify({ error: "Party name, date, production name, and phone numbers are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!whatsappToken) {
      return new Response(
        JSON.stringify({ error: "WhatsApp API token not configured (WHATSAPP_API_TOKEN)" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!phoneNumberId) {
      return new Response(
        JSON.stringify({ error: "WhatsApp Phone Number ID not configured (WHATSAPP_PHONE_NUMBER_ID)" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Prepare a default announcement message
    const groupTitle = `${partyName} - ${productionName} - ${new Date(partyDate).toLocaleDateString()}`;
    const messageBody = `Updates for ${groupTitle}\nYou're receiving this message because you're on the guest list.`;

    // Send individual WhatsApp messages (Cloud API) instead of creating a group
    const results: Array<{ to: string; ok: boolean; status: number; body?: any }> = [];

    for (const raw of phoneNumbers) {
      const to = normalizePhone(raw);
      try {
        const resp = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: messageBody },
          }),
        });
        const body = await resp.json();
        if (!resp.ok) {
          console.error('WhatsApp API error:', { to, body });
          results.push({ to, ok: false, status: resp.status, body });
        } else {
          results.push({ to, ok: true, status: resp.status, body });
        }
      } catch (err) {
        console.error('WhatsApp send error:', { to, err });
        results.push({ to, ok: false, status: 0, body: { error: String(err) } });
      }
    }

    const successCount = results.filter(r => r.ok).length;

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        sent: successCount,
        total: phoneNumbers.length,
        results,
        note: 'Group creation is not supported by WhatsApp Cloud API. Messages were sent individually instead.'
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in create-whatsapp-group function:", error);
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
