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
  ticket_types?: TicketType[];
  max_tickets_per_user?: number;
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
  const [userQR, setUserQR] = useState<QRCodeData | null>(null);
  const [friendQRs, setFriendQRs] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBuyForFriends, setShowBuyForFriends] = useState(false);
  const [selectedTicketType, setSelectedTicketType] = useState<TicketType | null>(null);
  const [hasPaid, setHasPaid] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProduction();
    checkExistingQRs();
    checkPaymentStatus();
  }, [party.id]);

  const loadProduction = async () => {
    if (!party.production_id) return;
    
    const { data, error } = await supabase
      .from('productions')
      .select('id, name, description, logo_url')
      .eq('id', party.production_id)
      .single();

    if (!error && data) {
      setProduction(data);
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

    // Check friend QRs (assuming there's a way to identify friend tickets)
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
    
    setHasPaid(!!data && !error);
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

      toast({
        title: "QR Code Generated",
        description: "Your QR code has been submitted for approval."
      });
      
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
        description: "You can now generate your QR code."
      });
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
      // TODO: Implement email sending via edge function
      toast({
        title: "Email Feature",
        description: "Email sending will be implemented with Resend integration.",
        variant: "default"
      });
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
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
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
          <Card>
            <CardHeader>
              <CardTitle>
                <RtlText text={production.name} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <img 
                src={production.logo_url} 
                alt={`${production.name} logo`}
                className="w-full h-auto object-contain rounded-md"
              />
              {production.description && (
                <div className="mt-4">
                  <RtlText text={production.description} className="text-sm text-muted-foreground whitespace-pre-wrap" />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* E. Party Photo Container */}
        {party.photo_url && (
          <Card>
            <CardHeader>
              <CardTitle>Party Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <img 
                src={party.photo_url} 
                alt={party.name}
                className="w-full h-auto object-contain rounded-md"
              />
            </CardContent>
          </Card>
        )}

        {/* F. Party Details Container */}
        <Card>
          <CardHeader>
            <CardTitle>Party Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <strong>Date:</strong> {new Date(party.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            {party.description && (
              <div className="text-sm">
                <strong>Description:</strong>
                <RtlText text={party.description} className="text-sm text-muted-foreground whitespace-pre-wrap mt-1" />
              </div>
            )}
            {party.price !== null && (
              <div className="text-sm">
                <strong>Price:</strong> {party.price} ILS {party.is_free && <span className="text-green-600">(Free)</span>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* G. Ticket Options Container */}
        {!userQR && (
          <Card>
            <CardHeader>
              <CardTitle>
                {party.is_free ? 'Get Your Free Ticket' : 'Purchase Ticket'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {party.ticket_types && party.ticket_types.length > 0 ? (
                <div className="space-y-3">
                  {party.ticket_types.map((ticketType) => {
                    const status = getTicketStatus(ticketType);
                    return (
                      <div key={ticketType.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <div className="font-medium">{ticketType.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {ticketType.price === 0 ? 'Free' : `${ticketType.price} ILS`}
                            </div>
                            <div className="text-xs">
                              {ticketType.quantity - ticketType.sold} tickets remaining
                            </div>
                          </div>
                        </div>
                        {!party.is_free && ticketType.price > 0 && !hasPaid ? (
                          <Button
                            onClick={() => handlePayment(ticketType)}
                            disabled={loading || status === 'sold-out'}
                            className="w-full"
                          >
                            {status === 'sold-out' ? 'Sold Out' : `Pay ${ticketType.price} ILS`}
                          </Button>
                        ) : (
                          <Button
                            onClick={() => generateQR(ticketType)}
                            disabled={loading || status === 'sold-out'}
                            className="w-full"
                          >
                            {status === 'sold-out' ? 'Sold Out' : 'Get Ticket'}
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
            </CardContent>
          </Card>
        )}

        {/* H. Buy for Friends Container */}
        <Card>
          <CardHeader>
            <CardTitle>Buy Tickets for Friends</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => setShowBuyForFriends(true)}
              className="w-full flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Buy Tickets for Friends
            </Button>
          </CardContent>
        </Card>

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
              <p className="text-xs text-muted-foreground">
                Status: {userQR.is_approved ? 'Approved' : 'Pending Approval'}
                {userQR.is_scanned && ' • Scanned'}
              </p>
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
                    <p className="text-xs text-muted-foreground">
                      Status: {friendQR.is_approved ? 'Approved' : 'Pending Approval'}
                      {friendQR.is_scanned && ' • Scanned'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendQRCode(friendQR.code, 'email', friendQR.friend_display_name)}
                        className="flex items-center gap-1"
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