import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users } from 'lucide-react';
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
}

interface PartyDetailsProps {
  party: Party;
  user: any;
  onBack: () => void;
}

const PartyDetails = ({ party, user, onBack }: PartyDetailsProps) => {
  const [production, setProduction] = useState<Production | null>(null);
  const [userQR, setUserQR] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBuyForFriends, setShowBuyForFriends] = useState(false);
  const [selectedTicketType, setSelectedTicketType] = useState<TicketType | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProduction();
    checkExistingQR();
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

  const checkExistingQR = async () => {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('id, code, is_approved, is_scanned')
      .eq('user_id', user.id)
      .eq('party_id', party.id)
      .maybeSingle();

    if (!error && data) {
      setUserQR(data);
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

      toast({
        title: "QR Code Generated",
        description: "Your QR code has been submitted for approval."
      });
      
      checkExistingQR();
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
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {userQR && (
            <Button
              variant="outline"
              onClick={() => setShowBuyForFriends(true)}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Buy for Friends
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <RtlText text={party.name} />
            </CardTitle>
            {production && (
              <p className="text-sm text-muted-foreground">
                <RtlText text={production.name} />
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {party.photo_url && (
              <img 
                src={party.photo_url} 
                alt={party.name}
                className="w-full h-auto object-contain rounded-md"
              />
            )}

            {userQR && (
              <div className="text-center space-y-2">
                <h3 className="font-medium">Your QR Code</h3>
                <div className="bg-white p-4 rounded-lg inline-block">
                  <QRCodeSVG value={userQR.code} size={200} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Status: {userQR.is_approved ? 'Approved' : 'Pending Approval'}
                  {userQR.is_scanned && ' • Scanned'}
                </p>
              </div>
            )}

            {party.description && (
              <div className="space-y-2">
                <h3 className="font-medium">Party Information</h3>
                <RtlText text={party.description} className="text-sm text-muted-foreground whitespace-pre-wrap" />
              </div>
            )}

            {!userQR && (
              <div className="space-y-4">
                <h3 className="font-medium">
                  {party.is_free ? 'Generate QR Code' : 'Purchase Ticket'}
                </h3>
                
                {party.ticket_types && party.ticket_types.length > 0 ? (
                  <div className="space-y-2">
                    {party.ticket_types.map((ticketType) => {
                      const status = getTicketStatus(ticketType);
                      return (
                        <div key={ticketType.id} className="border rounded p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{ticketType.label}</div>
                              <div className="text-sm text-muted-foreground">
                                {ticketType.price === 0 ? 'Free' : `${ticketType.price} ILS`}
                              </div>
                              <div className="text-xs">
                                {ticketType.quantity - ticketType.sold} tickets remaining
                              </div>
                            </div>
                            <Button
                              onClick={() => generateQR(ticketType)}
                              disabled={loading || status === 'sold-out'}
                              className={status === 'sold-out' ? 'bg-gray-400' : ''}
                            >
                              {status === 'sold-out' ? 'Sold Out' : 
                               ticketType.price === 0 ? 'Get Ticket' : 'Buy Ticket'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Button
                    onClick={() => generateQR()}
                    disabled={loading}
                    className="w-full"
                  >
                    {party.is_free ? 'Generate Free QR Code' : `Buy Ticket - ${party.price} ILS`}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PartyDetails;