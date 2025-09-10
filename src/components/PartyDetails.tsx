import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Mail, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import BuyTicketsForFriends from './BuyTicketsForFriends';
import RtlText from './RtlText';

interface Party {
  id: string;
  name: string;
  date: string;
  photo_url: string | null;
  description: string | null;
  price: number | null;
  is_free: boolean;
  production_id: string | null;
  start_time?: string | null;
  end_time?: string | null;
}

interface TicketType {
  id: string;
  label: string;
  price: number;
  quantity: number;
  sold: number;
}

interface Production {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
}

interface QRCodeData {
  id: string;
  code: string;
  is_approved: boolean;
  is_scanned: boolean;
  friend_display_name?: string;
}

interface PartyDetailsProps {
  party: Party;
  user: any;
  onBack: () => void;
}

const PartyDetails = ({ party, user, onBack }: PartyDetailsProps) => {
  const [production, setProduction] = useState<Production | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [userQR, setUserQR] = useState<QRCodeData | null>(null);
  const [friendQRs, setFriendQRs] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBuyForFriends, setShowBuyForFriends] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProduction();
    loadTicketTypes();
    checkExistingQRs();
    checkPaymentStatus();
  }, [party.id]);

  const loadProduction = async () => {
    if (!party.production_id) return;
    
    const { data, error } = await supabase
      .from('productions')
      .select('id, name, description, logo_url')
      .eq('id', party.production_id)
      .maybeSingle();

    if (!error && data) {
      setProduction(data);
    }
  };

  const loadTicketTypes = async () => {
    const { data, error } = await supabase
      .from('ticket_types')
      .select('*')
      .eq('party_id', party.id)
      .order('price', { ascending: true });

    if (!error && data) {
      setTicketTypes(data);
    }
  };

  const checkExistingQRs = async () => {
    // Check user's own QR
    const { data: userQRData, error: userError } = await supabase
      .from('qr_codes')
      .select('id, code, is_approved, is_scanned')
      .eq('user_id', user.id)
      .eq('party_id', party.id)
      .maybeSingle();

    if (!userError && userQRData) {
      setUserQR(userQRData);
    }

    // Check friend QRs - get QRs purchased by this user for friends
    const { data: friendQRData, error: friendError } = await supabase
      .from('qr_codes')
      .select(`
        id, 
        code, 
        is_approved, 
        is_scanned,
        friends!inner(friend_display_name)
      `)
      .eq('user_id', user.id)
      .eq('party_id', party.id)
      .neq('id', userQRData?.id || '');

    if (!friendError && friendQRData) {
      setFriendQRs(friendQRData.map(qr => ({
        ...qr,
        friend_display_name: (qr as any).friends?.friend_display_name
      })));
    }
  };

  const checkPaymentStatus = async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('id')
      .eq('user_id', user.id)
      .eq('party_id', party.id)
      .eq('status', 'paid')
      .maybeSingle();
    
    const hasPaidStatus = !!data && !error;
    setHasPaid(hasPaidStatus);

    // Auto-generate QR if payment exists but no QR found
    if (hasPaidStatus && !userQR) {
      await autoGenerateQR();
    }
  };

  const autoGenerateQR = async () => {
    try {
      const qrData = `${user.id}-${party.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase
        .from('qr_codes')
        .insert({
          user_id: user.id,
          party_id: party.id,
          code: qrData,
          is_approved: false
        });

      if (!error) {
        // Check for auto-approval
        const { data: existingApproval } = await supabase
          .from('qr_codes')
          .select('auto_approved')
          .eq('user_id', user.id)
          .eq('auto_approved', true)
          .limit(1)
          .maybeSingle();

        if (existingApproval) {
          await supabase
            .from('qr_codes')
            .update({
              is_approved: true,
              auto_approved: true,
              approved_at: new Date().toISOString()
            })
            .eq('code', qrData);
        }

        checkExistingQRs();
      }
    } catch (error) {
      console.error('Auto QR generation error:', error);
    }
  };

  const handlePayment = async (ticketType?: TicketType) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          party_id: party.id,
          amount: ticketType?.price || party.price || 0,
          status: 'paid'
        });

      if (error) throw error;

      setHasPaid(true);
      toast({
        title: "Payment Successful",
        description: "Your QR code is being generated..."
      });

      // Auto-generate QR after payment
      await autoGenerateQR();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateQR = async (ticketType?: TicketType) => {
    setLoading(true);
    try {
      const qrData = `${user.id}-${party.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase
        .from('qr_codes')
        .insert({
          user_id: user.id,
          party_id: party.id,
          code: qrData,
          is_approved: false,
          ticket_type_id: ticketType?.id
        });

      if (error) throw error;

      // Check for auto-approval
      const { data: existingApproval } = await supabase
        .from('qr_codes')
        .select('auto_approved')
        .eq('user_id', user.id)
        .eq('auto_approved', true)
        .limit(1)
        .maybeSingle();

      const isAutoApproved = existingApproval?.auto_approved;

      if (isAutoApproved) {
        await supabase
          .from('qr_codes')
          .update({
            is_approved: true,
            auto_approved: true,
            approved_at: new Date().toISOString()
          })
          .eq('code', qrData);
      }

      // Send QR code via email
      try {
        await supabase.functions.invoke('send-qr-code-email', {
          body: {
            to: user.email,
            qrCode: qrData,
            partyName: party.name,
            userName: user.display_name || user.email,
            partyDate: new Date(party.date).toLocaleDateString('en-GB'),
            productionName: production?.name || 'Event'
          }
        });
        
        toast({
          title: isAutoApproved ? "QR Code Generated & Approved" : "QR Code Generated",
          description: "Your QR code has been sent to your email!"
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        toast({
          title: isAutoApproved ? "QR Code Generated & Approved" : "QR Code Generated", 
          description: isAutoApproved ? "Your ticket is ready!" : "Your QR code has been submitted for approval."
        });
      }
      
      checkExistingQRs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendQRCode = async (qrCode: string, method: 'email' | 'whatsapp', friendName?: string) => {
    if (method === 'email') {
      try {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke('send-qr-code', {
          body: {
            qrCode,
            partyName: party.name,
            friendName,
            recipientEmail: 'friend@example.com' // You'll need to get this from user input
          }
        });

        if (error) throw error;

        toast({
          title: "Email Sent",
          description: `QR code sent via email${friendName ? ` for ${friendName}` : ''}`
        });
      } catch (error: any) {
        toast({
          title: "Email Error",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    } else {
      // WhatsApp sharing
      const message = `Here's your QR code for ${party.name}${friendName ? ` (for ${friendName})` : ''}: ${qrCode}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const getTicketStatus = (ticketType: TicketType) => {
    const remaining = ticketType.quantity - ticketType.sold;
    if (remaining <= 0) return 'sold-out';
    if (remaining <= ticketType.quantity * 0.1) return 'almost-sold-out';
    return 'available';
  };

  if (showBuyForFriends) {
    return (
      <BuyTicketsForFriends
        party={party}
        user={user}
        onBack={() => setShowBuyForFriends(false)}
      />
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="w-full max-w-none mx-auto space-y-6 px-4">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">
            <RtlText text={party.name} />
          </h1>
          <div></div>
        </div>

        {/* D. Production Photo Container */}
        {production?.logo_url && (
          <div className="w-full">
            <img 
              src={production.logo_url} 
              alt={`${production.name} logo`}
              className="w-full h-auto object-contain"
            />
          </div>
        )}

        {/* E. Party Photo Container */}
        {party.photo_url && (
          <div className="w-full">
            <img 
              src={party.photo_url} 
              alt={party.name}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* F. Party Details Container */}
        <div className="w-full p-4 space-y-3 bg-card">
          <h2 className="text-lg font-bold">Party Details</h2>
            <div className="text-sm">
              <strong>Date:</strong> {new Date(party.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            {(party.start_time || party.end_time) && (
              <div className="text-sm">
                <strong>Time:</strong> 
                {party.start_time && ` From ${party.start_time}`}
                {party.end_time && ` to ${party.end_time}`}
              </div>
            )}
            {party.description && (
              <div className="text-sm">
                <strong>Description:</strong>
                <div className="mt-1">
                  <RtlText text={party.description} className="text-sm text-muted-foreground whitespace-pre-wrap" />
                </div>
              </div>
            )}
            {production?.description && (
              <div className="text-sm">
                <strong>Production:</strong>
                <div className="mt-1">
                  <RtlText text={production.description} className="text-sm text-muted-foreground whitespace-pre-wrap" />
                </div>
              </div>
            )}
        </div>

        {/* G. Ticket Options Container */}
        <div className="w-full p-4 space-y-4 bg-card">
          <h2 className="text-lg font-bold">
            {party.is_free ? 'Get Your Free Ticket' : 'Purchase Ticket'}
          </h2>
            {!userQR && (
              <>
                {ticketTypes.length > 0 ? (
                  <div className="space-y-3">
                    {ticketTypes.map((ticketType) => {
                      const status = getTicketStatus(ticketType);
                      const remaining = ticketType.quantity - ticketType.sold;
                      return (
                        <div key={ticketType.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <div className="font-medium">{ticketType.label}</div>
                              <div className="text-sm text-muted-foreground">
                                {ticketType.price === 0 ? 'Free' : `${ticketType.price} ILS`}
                              </div>
                              <div className="text-xs text-blue-600">
                                {status === 'sold-out' ? 'Sold Out' : `${remaining} tickets remaining`}
                              </div>
                            </div>
                          </div>
                          {ticketType.price > 0 && !hasPaid ? (
                            <Button
                              onClick={() => handlePayment(ticketType)}
                              disabled={loading || status === 'sold-out'}
                              className="w-full"
                            >
                              {loading ? "Processing..." : status === 'sold-out' ? 'Sold Out' : `Pay ${ticketType.price} ILS`}
                            </Button>
                          ) : (
                            <Button
                              onClick={() => generateQR(ticketType)}
                              disabled={loading || status === 'sold-out'}
                              className="w-full"
                            >
                              {loading ? "Generating..." : status === 'sold-out' ? 'Sold Out' : 'Get Ticket'}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    {!party.is_free && party.price && !hasPaid ? (
                      <Button
                        onClick={() => handlePayment()}
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? "Processing..." : `Pay ${party.price} ILS`}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => generateQR()}
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? "Generating..." : (party.is_free ? 'Get Free Ticket' : 'Get Ticket')}
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
            
            {userQR && (
              <div className="text-center text-green-600 font-medium">
                ✓ You already have a ticket for this party
              </div>
            )}
        </div>

        {/* H. Buy for Friends Container - Always Available */}
        <div className="w-full p-4 bg-card">
          <h2 className="text-lg font-bold mb-4">Buy Tickets for Friends</h2>
          <Button
            variant="outline"
            onClick={() => setShowBuyForFriends(true)}
            className="w-full flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Buy Tickets for Friends
          </Button>
        </div>

        {/* User's QR Code Container */}
        {userQR && (
          <Card>
            <CardHeader>
              <CardTitle>Your QR Code</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="bg-white p-4 rounded-lg inline-block">
                <QRCodeSVG value={userQR.code} size={200} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Status: {userQR.is_approved ? '✅ Approved' : '⏳ Pending Approval'}
                </p>
                {userQR.is_scanned && (
                  <p className="text-xs text-green-600">✓ Scanned</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Show this QR code to the admin for scanning
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Friends' QR Codes Container */}
        {friendQRs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Friends' QR Codes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {friendQRs.map((friendQR) => (
                <div key={friendQR.id} className="border rounded-lg p-4">
                  <div className="text-center space-y-3">
                    <div className="font-medium">
                      {friendQR.friend_display_name || 'Friend'}
                    </div>
                    <div className="bg-white p-3 rounded-lg inline-block">
                      <QRCodeSVG value={friendQR.code} size={150} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium">
                        Status: {friendQR.is_approved ? '✅ Approved' : '⏳ Pending Approval'}
                      </p>
                      {friendQR.is_scanned && (
                        <p className="text-xs text-green-600">✓ Scanned</p>
                      )}
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendQRCode(friendQR.code, 'email', friendQR.friend_display_name)}
                        className="flex items-center gap-1"
                        disabled={loading}
                      >
                        <Mail className="h-4 w-4" />
                        Email
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendQRCode(friendQR.code, 'whatsapp', friendQR.friend_display_name)}
                        className="flex items-center gap-1"
                      >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PartyDetails;