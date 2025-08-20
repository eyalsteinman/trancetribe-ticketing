import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { User } from '@supabase/supabase-js';
import { ArrowLeft, ArrowUpDown, X } from 'lucide-react';
import { useBackground } from '@/contexts/BackgroundContext';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import BuyTicketsForFriends from './BuyTicketsForFriends';

interface Party {
  id: string;
  name: string;
  date: string;
  is_active: boolean;
  photo_url: string | null;
  description: string | null;
  price: number | null;
  is_free: boolean;
  required_socials: string[];
  production_id: string | null;
  ticket_count: number | null;
  start_time: string | null;
  end_time: string | null;
}

interface UserPartiesProps {
  user: User;
  onBack: () => void;
}

const platformLabels: Record<string, string> = { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', x: 'X (Twitter)' };

const UserParties = ({ user, onBack }: UserPartiesProps) => {
  const [currentView, setCurrentView] = useState<'parties' | 'buy-tickets'>('parties');
  const [selectedPartyForTickets, setSelectedPartyForTickets] = useState<Party | null>(null);
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingParties, setLoadingParties] = useState(true);
  const [sortAscending, setSortAscending] = useState(true);
  const [infoParty, setInfoParty] = useState<Party | null>(null);
  const [hasPaid, setHasPaid] = useState(false);
  const [userSocials, setUserSocials] = useState<Record<string, string>>({});
  const [showSocialsDialog, setShowSocialsDialog] = useState(false);
  const [missingPlatforms, setMissingPlatforms] = useState<string[]>([]);
  const [socialInputs, setSocialInputs] = useState<Record<string, string>>({});
  const [pendingAction, setPendingAction] = useState<null | 'pay' | 'qr'>(null);
  const [infoProduction, setInfoProduction] = useState<{ name: string; description: string | null; logo_url: string | null } | null>(null);
  const [partyTicketCounts, setPartyTicketCounts] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  // Auto-close dialogs on back navigation - prevent back navigation when dialogs are open
  useBackNavigation({
    onBackNavigation: () => {
      if (showSocialsDialog) {
        setShowSocialsDialog(false);
        setPendingAction(null);
      }
      if (infoParty) {
        setInfoParty(null);
      }
    },
    isActive: showSocialsDialog || !!infoParty,
    preventBackNavigation: true
  });

  useEffect(() => {
    loadParties();
    loadTicketCounts();
    
    const channel = supabase
      .channel('public:parties-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parties' }, (payload: any) => {
        if (payload.eventType === 'DELETE') {
          setParties((prev) => prev.filter((p) => p.id !== (payload.old as any).id));
        } else {
          loadParties();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

useEffect(() => { loadUserSocials(); }, []);

useEffect(() => {
  loadParties();
}, [sortAscending]);

useEffect(() => {
  const loadProduction = async () => {
    if (infoParty?.production_id) {
      const { data } = await (supabase as any)
        .from('productions')
        .select('name, description, logo_url')
        .eq('id', infoParty.production_id)
        .maybeSingle();
      setInfoProduction((data as any) || null);
    } else {
      setInfoProduction(null);
    }
  };
  loadProduction();
}, [infoParty]);

  useEffect(() => {
    if (selectedParty) {
      loadExistingQR();
      loadPaymentStatus();
      const required = Array.isArray(selectedParty.required_socials) ? selectedParty.required_socials : [];
      const missing = required.filter((p) => !userSocials[p]);
      if (missing.length > 0) {
        setMissingPlatforms(missing);
        setSocialInputs((prev) => {
          const inputs: Record<string, string> = { ...prev };
          missing.forEach((p) => { inputs[p] = userSocials[p] || ''; });
          return inputs;
        });
        setShowSocialsDialog(true);
      } else {
        setMissingPlatforms([]);
        setShowSocialsDialog(false);
      }
    } else {
      setQrCode(null);
      setHasPaid(false);
      setShowSocialsDialog(false);
      setMissingPlatforms([]);
    }
  }, [selectedParty, userSocials]);

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
          required_socials: Array.isArray(p.required_socials) ? p.required_socials : [],
          production_id: p.production_id ?? null,
          ticket_count: p.ticket_count ?? null,
          start_time: p.start_time ?? null,
          end_time: p.end_time ?? null
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

  const loadTicketCounts = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('qr_codes')
        .select('party_id');
      
      if (!error && data) {
        const counts: Record<string, number> = {};
        (data as any[]).forEach((qr) => {
          counts[qr.party_id] = (counts[qr.party_id] || 0) + 1;
        });
        setPartyTicketCounts(counts);
      }
    } catch (error) {
      console.error('Error loading ticket counts:', error);
    }
  };

  const loadUserSocials = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('user_socials')
        .select('platform, url')
        .eq('user_id', user.id);
      if (!error && data) {
        const map: Record<string, string> = {};
        (data as any[]).forEach((row) => {
          map[row.platform] = row.url || '';
        });
        setUserSocials(map);
      }
    } catch (e) {
      console.error('Error loading user socials:', e);
    }
  };

  const loadExistingQR = async () => {
    if (!selectedParty) return;
    
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('code, is_approved, is_scanned')
        .eq('user_id', user.id)
        .eq('party_id', selectedParty.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error && data.is_scanned) {
        // QR was scanned
        toast({
          title: "QR Used",
          description: "qr used",
          variant: "default"
        });
      } else if (data && !error && data.is_approved) {
        setQrCode(data.code);
        toast({
          title: "QR Approved! Enjoy the party!",
          description: "qr approved! Enjoy the party!",
          variant: "default"
        });
      } else if (data && !error && !data.is_approved) {
        toast({
          title: "QR Pending Approval",
          description: "qr pending approval",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error loading existing QR code:', error);
    }
  };

  const ensureRequiredSocials = (action: 'pay' | 'qr'): boolean => {
    if (!selectedParty) return false;
    const required = Array.isArray(selectedParty.required_socials) ? selectedParty.required_socials : [];
    const missing = required.filter((p) => !userSocials[p]);
    if (missing.length > 0) {
      setMissingPlatforms(missing);
      const inputs: Record<string, string> = {};
      missing.forEach((p) => { inputs[p] = userSocials[p] || ''; });
      setSocialInputs(inputs);
      setPendingAction(action);
      setShowSocialsDialog(true);
      return false;
    }
    return true;
  };

  const handlePayNow = async () => {
    if (!selectedParty) return;
    if (!ensureRequiredSocials('pay')) return;
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('payments')
        .insert({
          user_id: user.id,
          party_id: selectedParty.id,
          amount: selectedParty.price || 0,
          status: 'paid'
        });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
      setHasPaid(true);
      toast({ title: 'Payment successful', description: 'You can now generate a QR code.' });
    } catch (e) {
      console.error('Payment error', e);
      toast({ title: 'Error', description: 'Payment failed. Try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  const loadPaymentStatus = async () => {
    if (!selectedParty) return;
    try {
      const { data, error } = await (supabase as any)
        .from('payments')
        .select('id')
        .eq('user_id', user.id)
        .eq('party_id', selectedParty.id)
        .eq('status', 'paid')
        .maybeSingle();
      setHasPaid(!!data && !error);
    } catch (e) {
      console.error('Error checking payment status:', e);
      setHasPaid(false);
    }
  };
  
  const saveMissingSocials = async () => {
    setLoading(true);
    try {
      if (missingPlatforms.length === 0) {
        setShowSocialsDialog(false);
        return;
      }
      const platformsToSave = missingPlatforms.filter((p) => (socialInputs[p] || '').trim());
      if (platformsToSave.length !== missingPlatforms.length) {
        toast({ title: 'Missing info', description: 'Please fill all required socials.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      const { error: delErr } = await (supabase as any)
        .from('user_socials')
        .delete()
        .eq('user_id', user.id)
        .in('platform', platformsToSave);
      if (delErr) throw delErr;
      const rows = platformsToSave.map((p) => ({ user_id: user.id, platform: p, url: socialInputs[p].trim() }));
      const { error: insErr } = await (supabase as any)
        .from('user_socials')
        .insert(rows);
      if (insErr) throw insErr;

      const updated = { ...userSocials };
      platformsToSave.forEach((p) => { updated[p] = socialInputs[p].trim(); });
      setUserSocials(updated);
      setShowSocialsDialog(false);
      setMissingPlatforms([]);
      const action = pendingAction;
      setPendingAction(null);
      if (action === 'pay') {
        handlePayNow();
      } else if (action === 'qr') {
        generateQRCode();
      }
    } catch (e: any) {
      console.error('Save required socials error', e);
      toast({ title: 'Error', description: e.message || 'Failed to save socials', variant: 'destructive' });
    } finally {
      setLoading(false);
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

    if (!ensureRequiredSocials('qr')) {
      return;
    }

    if (selectedParty.price && !selectedParty.is_free && !hasPaid) {
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
          code: qrData,
          is_approved: false
        });

      if (error) {
        console.error('QR Code generation error:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        // Check if this user has auto-approval
        const { data: existingApproval } = await supabase
          .from('qr_codes')
          .select('auto_approved')
          .eq('user_id', user.id)
          .eq('auto_approved', true)
          .limit(1)
          .maybeSingle();

        if (existingApproval) {
          // Auto-approve this QR code
          await supabase
            .from('qr_codes')
            .update({
              is_approved: true,
              auto_approved: true,
              approved_at: new Date().toISOString()
            })
            .eq('code', qrData);
          
          setQrCode(qrData);
          toast({
            title: "QR Approved! Enjoy the party!",
            description: "qr approved! Enjoy the party!",
          });
        } else {
          toast({
            title: "QR Pending Approval",
            description: "qr pending approval",
            variant: "default"
          });
        }
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

  const selectParty = async (party: Party) => {
    // Check if user already has a QR code for this party
    const { data: existingQR } = await supabase
      .from('qr_codes')
      .select('id, is_approved, is_scanned')
      .eq('user_id', user.id)
      .eq('party_id', party.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingQR) {
      // User already has a QR code, show buy tickets for friends option
      setSelectedPartyForTickets(party);
      setCurrentView('buy-tickets');
    } else {
      // User doesn't have a QR code, proceed normally
      setSelectedParty(party);
    }
  };

  const goBackToPartyList = () => {
    setSelectedParty(null);
    setQrCode(null);
  };

  if (currentView === 'buy-tickets' && selectedPartyForTickets) {
    return (
      <BuyTicketsForFriends 
        user={user} 
        party={selectedPartyForTickets} 
        onBack={() => {
          setCurrentView('parties');
          setSelectedPartyForTickets(null);
        }}
      />
    );
  }

  if (selectedParty) {
    return (
      <div 
        className="min-h-screen p-4 transition-colors duration-500"
        style={{ 
          backgroundColor
        }}
      >
        <div className="max-w-md mx-auto space-y-6 text-left">
          <div className="flex justify-between items-center">
            <Button variant="outline" size="icon" onClick={goBackToPartyList} aria-label="Back" className="absolute top-4 right-4 z-[9999] on-color back-button">
              <ArrowLeft className="h-4 w-4" />
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
                {(selectedParty.start_time || selectedParty.end_time) && (
                  <div className="text-sm text-muted-foreground">
                    {selectedParty.start_time ? `Starts: ${selectedParty.start_time}` : ''}
                    {selectedParty.end_time ? ` • Ends: ${selectedParty.end_time}` : ''}
                  </div>
                )}
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
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedPartyForTickets(selectedParty);
                      setCurrentView('buy-tickets');
                    }}
                    className="w-full"
                  >
                    Buy Tickets for Friends
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {!selectedParty.is_free && selectedParty.price && !hasPaid ? (
                    <>
                      <Button onClick={handlePayNow} disabled={loading} className="w-full py-4 text-lg">
                        {loading ? "Processing..." : `Pay Now (${selectedParty.price} ILS)`}
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Complete payment to generate your QR code.
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
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedPartyForTickets(selectedParty);
                      setCurrentView('buy-tickets');
                    }}
                    className="w-full"
                  >
                    Buy Tickets for Friends
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

            <Dialog open={showSocialsDialog} onOpenChange={setShowSocialsDialog}>
              <DialogContent className="text-black">
                <DialogHeader>
                  <DialogTitle className="text-black">Social profile required</DialogTitle>
                  <DialogDescription className="text-black">
                    This event requires the following social profile(s). Please provide URLs to continue.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  {missingPlatforms.map((p) => (
                    <div key={p}>
                      <label className="text-sm font-medium text-black">{platformLabels[p] || p}</label>
                      <Input
                        placeholder={`Enter your ${platformLabels[p] || p} profile URL`}
                        value={socialInputs[p] || ''}
                        onChange={(e) => setSocialInputs((prev) => ({ ...prev, [p]: e.target.value }))}
                        inputMode="url"
                        className="text-black"
                      />
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setShowSocialsDialog(false); setPendingAction(null); }}>Cancel</Button>
                  <Button onClick={saveMissingSocials} disabled={loading}>{loading ? 'Saving...' : 'Save & Continue'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-4 transition-colors duration-500"
      style={{ 
        backgroundColor
      }}
    >
      <div className="max-w-md mx-auto space-y-6 text-left">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack} aria-label="Back" className="absolute top-4 right-4 z-[9999] on-color back-button">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 
            className="text-xl font-bold"
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
                          className="absolute right-2 top-2 h-8 w-8 rounded-full border flex items-center justify-center text-sm"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            e.preventDefault();
                            setInfoParty(party); 
                          }}
                          aria-label="Party info"
                        >i</button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(party.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      {party.price !== null && (
                        <div className="text-xs font-medium">Price: {party.price} ILS {party.is_free && <span className="text-green-600">(Free)</span>}</div>
                      )}
                      {party.ticket_count !== null && (
                        <div className="text-xs text-blue-600 font-medium">
                          Tickets: {Math.max(0, party.ticket_count - (partyTicketCounts[party.id] || 0))} left of {party.ticket_count}
                        </div>
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
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white text-black rounded-lg w-11/12 max-w-md p-4 relative max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <button className="absolute top-2 right-2 text-black text-3xl w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded" onClick={() => setInfoParty(null)} aria-label="Close">×</button>
              {infoProduction?.logo_url && (
                <img src={infoProduction.logo_url} alt={`${infoProduction.name} logo`} className="w-full h-auto object-contain rounded mb-3" />
              )}
              {infoProduction?.description && (
                <div className="text-sm text-gray-800 whitespace-pre-wrap mb-3">{infoProduction.description}</div>
              )}
              <h2 className="text-lg font-semibold mb-2 text-black">{infoParty.name}</h2>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{infoParty.description || 'No additional information provided.'}</div>
            </div>
          </div>
        )}

        <Dialog open={showSocialsDialog} onOpenChange={setShowSocialsDialog}>
          <DialogContent className="text-black">
            <DialogHeader>
              <DialogTitle className="text-black">Social profile required</DialogTitle>
              <DialogDescription className="text-black">
                This event requires the following social profile(s). Please provide URLs to continue.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {missingPlatforms.map((p) => (
                <div key={p}>
                  <label className="text-sm font-medium text-black">{platformLabels[p] || p}</label>
                  <Input
                    placeholder={`Enter your ${platformLabels[p] || p} profile URL`}
                    value={socialInputs[p] || ''}
                    onChange={(e) => setSocialInputs((prev) => ({ ...prev, [p]: e.target.value }))}
                    inputMode="url"
                    className="text-black"
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowSocialsDialog(false); setPendingAction(null); }}>Cancel</Button>
              <Button onClick={saveMissingSocials} disabled={loading}>{loading ? 'Saving...' : 'Save & Continue'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UserParties;