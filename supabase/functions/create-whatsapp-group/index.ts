import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const whatsappToken = Deno.env.get("WHATSAPP_API_TOKEN");

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
        JSON.stringify({ error: "WhatsApp API token not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Format phone numbers for WhatsApp (remove non-numeric characters)
    const formattedPhoneNumbers = phoneNumbers.map(phone => 
      phone.replace(/\D/g, '').replace(/^0/, '+972') // Convert Israeli numbers
    );

    // Create WhatsApp group name
    const groupName = `${partyName} - ${productionName} - ${new Date(partyDate).toLocaleDateString()}`;

    console.log("Creating WhatsApp group:", { groupName, phoneNumbers: formattedPhoneNumbers });

    // Create group using WhatsApp Business API
    // Note: Replace YOUR_PHONE_NUMBER_ID with actual phone number ID from WhatsApp Business
    const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") || "YOUR_PHONE_NUMBER_ID";
    
    const groupResponse = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/groups`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: groupName,
        participants: formattedPhoneNumbers,
      }),
    });

    const groupData = await groupResponse.json();
    
    if (!groupResponse.ok) {
      console.error('WhatsApp API error:', groupData);
      return new Response(
        JSON.stringify({ error: "Failed to create WhatsApp group", details: groupData }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("WhatsApp group created successfully:", groupData);

    return new Response(JSON.stringify({ 
      success: true, 
      groupId: groupData.id,
      groupName: groupName,
      participantCount: formattedPhoneNumbers.length
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
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