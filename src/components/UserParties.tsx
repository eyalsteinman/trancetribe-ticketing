import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { User } from '@supabase/supabase-js';
import { ArrowLeft, ArrowUpDown } from 'lucide-react';
import { useBackground } from '@/contexts/BackgroundContext';

interface Party {
  id: string;
  name: string;
  date: string;
  is_active: boolean;
  photo_url: string | null;
  description: string | null;
  price: number | null;
  is_free: boolean;
}

interface UserPartiesProps {
  user: User;
  onBack: () => void;
}

const UserParties = ({ user, onBack }: UserPartiesProps) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingParties, setLoadingParties] = useState(true);
  const [sortAscending, setSortAscending] = useState(true);
  const [infoParty, setInfoParty] = useState<Party | null>(null);
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  useEffect(() => {
    loadParties();
  }, []);

  useEffect(() => {
    loadParties();
  }, [sortAscending]);

  useEffect(() => {
    if (selectedParty) {
      loadExistingQR();
    } else {
      setQrCode(null);
    }
  }, [selectedParty]);

  const loadParties = async () => {
    setLoadingParties(true);
    try {
      const { data, error } = await (supabase as any)
        .from('parties')
        .select('*')
        .order('date', { ascending: sortAscending });

      if (data && !error) {
        const normalized = (data as any[]).map((p) => ({
          id: p.id,
          name: p.name,
          date: p.date,
          is_active: p.is_active,
          photo_url: p.photo_url ?? null,
          description: p.description ?? null,
          price: p.price ?? null,
          is_free: p.is_free ?? false,
        }));
        setParties(normalized);
      } else {
        console.log('No parties found');
      }
    } catch (error) {
      console.error('Error loading parties:', error);
    } finally {
      setLoadingParties(false);
    }
  };

  const loadExistingQR = async () => {
    if (!selectedParty) return;
    
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('code')
        .eq('user_id', user.id)
        .eq('party_id', selectedParty.id)
        .eq('is_scanned', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setQrCode(data.code);
      }
    } catch (error) {
      console.error('Error loading existing QR code:', error);
    }
  };

  const generateQRCode = async () => {
    if (!selectedParty) {
      toast({
        title: "Error",
        description: "No party selected.",
        variant: "destructive"
      });
      return;
    }

    if (selectedParty.price && !selectedParty.is_free) {
      toast({
        title: "Payment required",
        description: "Please complete payment before generating a QR code.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const qrData = `${user.id}-${selectedParty.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase
        .from('qr_codes')
        .insert({
          user_id: user.id,
          party_id: selectedParty.id,
          code: qrData
        });

      if (error) {
        console.error('QR Code generation error:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setQrCode(qrData);
        toast({
          title: "Success",
          description: "QR code generated successfully!",
        });
      }
    } catch (error) {
      console.error('QR Code generation catch error:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectParty = (party: Party) => {
    setSelectedParty(party);
  };

  const goBackToPartyList = () => {
    setSelectedParty(null);
    setQrCode(null);
  };

  if (selectedParty) {
    return (
      <div 
        className="min-h-screen p-4 transition-colors duration-500"
        style={{ 
          backgroundColor,
          color: isBackgroundDark ? '#ffffff' : '#000000'
        }}
      >
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={goBackToPartyList} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your QR Code</CardTitle>
              <div className="text-center space-y-1">
                <div className="text-lg font-semibold">{selectedParty.name}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(selectedParty.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                {selectedParty.price !== null && (
                  <div className="text-sm font-medium">
                    Price: {selectedParty.price} ILS {selectedParty.is_free && <span className="text-xs text-green-600">(Free)</span>}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {qrCode ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-white p-4 rounded-lg">
                    <QRCodeSVG value={qrCode} size={200} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Show this QR code to the admin for scanning
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {!selectedParty.is_free && selectedParty.price ? (
                    <>
                      <Button disabled className="w-full py-4 text-lg bg-gray-400 text-white">
                        Payment required
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Please complete payment to generate a QR code.
                      </p>
                    </>
                  ) : (
                    <Button
                      onClick={generateQRCode}
                      disabled={loading}
                      className="w-full py-4 text-lg"
                    >
                      {loading ? "Generating..." : "Generate QR Code"}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-4 transition-colors duration-500"
      style={{ 
        backgroundColor,
        color: isBackgroundDark ? '#ffffff' : '#000000'
      }}
    >
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 
            className="text-2xl font-bold"
            style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
          >
            Parties
          </h1>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Select a Party</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortAscending(!sortAscending)}
                className="flex items-center gap-2"
              >
                <ArrowUpDown className="h-4 w-4" />
                {sortAscending ? "Oldest First" : "Newest First"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingParties ? (
              <p className="text-center text-muted-foreground">Loading parties...</p>
            ) : parties.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No parties found. Please wait for an admin to create a party.
              </p>
            ) : (
              parties.map((party) => {
                const partyDate = new Date(party.date);
                const now = new Date();
                const isToday = partyDate.toDateString() === now.toDateString();
                const isWithin24Hours = partyDate.getTime() > now.getTime() - 24 * 60 * 60 * 1000 && partyDate.getTime() <= now.getTime();
                const hasEnded = partyDate.getTime() < now.getTime() - 24 * 60 * 60 * 1000;
                
                const upcomingParties = parties.filter(p => new Date(p.date).getTime() >= now.getTime() - 24 * 60 * 60 * 1000);
                const soonestParty = upcomingParties.length > 0 ? upcomingParties.reduce((earliest, current) => 
                  new Date(current.date) < new Date(earliest.date) ? current : earliest
                ) : null;
                
                const showActive = soonestParty?.id === party.id && (isToday || isWithin24Hours);
                const showEnded = hasEnded;

                return (
                  <Button
                    key={party.id}
                    variant="outline"
                    className="w-full p-4 h-auto flex-col space-y-3"
                    onClick={() => selectParty(party)}
                  >
                    {party.photo_url && (
                      <div className="w-full">
                        <img 
                          src={party.photo_url} 
                          alt={party.name}
                          className="w-full h-auto object-contain rounded-md"
                        />
                      </div>
                    )}
                    <div className="w-full text-center space-y-1 relative">
                      <div className="font-semibold flex items-center justify-center gap-2">
                        {party.name}
                        <button
                          type="button"
                          className="ml-2 h-5 w-5 rounded-full border flex items-center justify-center text-xs"
                          onClick={(e) => { e.stopPropagation(); setInfoParty(party); }}
                          aria-label="Party info"
                        >i</button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(party.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      {party.price !== null && (
                        <div className="text-xs font-medium">Price: {party.price} ILS {party.is_free && <span className="text-green-600">(Free)</span>}</div>
                      )}
                      {showActive && (
                        <div className="text-xs text-green-600 font-medium">Active</div>
                      )}
                      {showEnded && (
                        <div className="text-xs text-red-600 font-medium">Ended</div>
                      )}
                    </div>
                  </Button>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Info Dialog */}
        {infoParty && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
            <div className="bg-white text-black rounded-lg w-11/12 max-w-md p-4 relative">
              <button className="absolute top-2 right-2" onClick={() => setInfoParty(null)} aria-label="Close">×</button>
              <h2 className="text-lg font-semibold mb-2">{infoParty.name}</h2>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{infoParty.description || 'No additional information provided.'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserParties;