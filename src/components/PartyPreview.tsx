import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import RtlText from './RtlText';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

interface PartyPreviewProps {
  party: Party;
  onBack: () => void;
  onLoginRequired: () => void;
}

const PartyPreview = ({ party, onBack, onLoginRequired }: PartyPreviewProps) => {
  const [production, setProduction] = useState<Production | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  useEffect(() => {
    loadProduction();
    loadTicketTypes();
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

  const handleTicketClick = () => {
    setShowLoginDialog(true);
  };

  const getTicketStatus = (ticketType: TicketType) => {
    const remaining = ticketType.quantity - ticketType.sold;
    if (remaining <= 0) return 'sold-out';
    if (remaining <= ticketType.quantity * 0.1) return 'almost-sold-out';
    return 'available';
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto space-y-6">
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

        {/* Production Photo Container */}
        {production?.logo_url && (
          <Card>
            <CardContent className="p-0">
              <img 
                src={production.logo_url} 
                alt={`${production.name} logo`}
                className="w-full h-auto object-contain rounded-md"
              />
            </CardContent>
          </Card>
        )}

        {/* Party Photo Container */}
        {party.photo_url && (
          <Card>
            <CardContent className="p-0">
              <img 
                src={party.photo_url} 
                alt={party.name}
                className="w-full h-auto object-contain rounded-md"
              />
            </CardContent>
          </Card>
        )}

        {/* Party Details Container */}
        <Card>
          <CardHeader>
            <CardTitle>Party Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>

        {/* Ticket Options Container - Preview Only */}
        <Card>
          <CardHeader>
            <CardTitle>
              {party.is_free ? 'Free Ticket Available' : 'Ticket Pricing'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                      <Button
                        onClick={handleTicketClick}
                        disabled={status === 'sold-out'}
                        className={`w-full ${ticketType.price === 0 ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
                      >
                        {status === 'sold-out' ? 'Sold Out' : (ticketType.price === 0 ? 'Get Free Ticket' : `Buy Ticket - ${ticketType.price} ILS`)}
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <div className="text-lg font-semibold">
                    {party.is_free ? 'Free Event' : `${party.price} ILS`}
                  </div>
                  {!party.is_free && (
                    <div className="text-sm text-muted-foreground">
                      Standard ticket price
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleTicketClick}
                  className={`w-full ${party.is_free ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
                >
                  {party.is_free ? 'Get Free Ticket' : `Buy Ticket - ${party.price} ILS`}
                </Button>
              </div>
            )}

            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                Login or create an account to purchase tickets
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Login Dialog */}
        <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Login Required</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>You must login or create an account first to purchase tickets.</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowLoginDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  setShowLoginDialog(false);
                  onLoginRequired();
                }}>
                  Login / Sign Up
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PartyPreview;