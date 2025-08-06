import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { User } from '@supabase/supabase-js';
import { ArrowLeft } from 'lucide-react';

interface Party {
  id: string;
  name: string;
  date: string;
  is_active: boolean;
  photo_url: string | null;
}

interface UserDashboardProps {
  user: User;
}

const UserDashboard = ({ user }: UserDashboardProps) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingParties, setLoadingParties] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadParties();
  }, []);

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
        .order('date', { ascending: false });

      if (data && !error) {
        setParties(data);
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
      const { data, error } = await (supabase as any)
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

    setLoading(true);
    try {
      // Generate a unique QR code
      const qrData = `${user.id}-${selectedParty.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await (supabase as any)
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

  const handleSignOut = async () => {
    try {
      // Clear all local state first
      setQrCode(null);
      setSelectedParty(null);
      setParties([]);
      
      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      // Even if server logout fails (session not found), we still successfully logged out locally
      if (error && !error.message.includes('Session not found')) {
        console.error('Sign out error:', error);
        toast({
          title: "Warning",
          description: "Logged out locally, but server logout failed.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Signed out successfully!",
        });
      }
    } catch (error) {
      console.error('Sign out catch error:', error);
      // Even if there's an error, force local logout
      toast({
        title: "Info", 
        description: "Logged out locally.",
      });
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
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={goBackToPartyList} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your QR Code</CardTitle>
              <div className="text-center space-y-1">
                <div className="text-lg font-semibold">{selectedParty.name}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(selectedParty.date).toLocaleDateString()}
                </div>
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
                  <Button
                    onClick={generateQRCode}
                    disabled={loading}
                    className="w-full py-4 text-lg"
                  >
                    {loading ? "Generating..." : "Generate QR Code"}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Click to generate your unique QR code for {selectedParty.name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Welcome!</h1>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select a Party</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingParties ? (
              <p className="text-center text-muted-foreground">Loading parties...</p>
            ) : parties.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No parties found. Please wait for an admin to create a party.
              </p>
            ) : (
              parties.map((party) => (
                <Button
                  key={party.id}
                  variant="outline"
                  className="w-full p-4 h-auto flex-col space-y-2"
                  onClick={() => selectParty(party)}
                >
                  <div className="font-semibold">{party.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(party.date).toLocaleDateString()}
                  </div>
                  {party.photo_url && (
                    <div className="w-full max-w-xs">
                      <img 
                        src={party.photo_url} 
                        alt={party.name}
                        className="w-full h-32 object-cover rounded-md"
                      />
                    </div>
                  )}
                  {party.is_active && (
                    <div className="text-xs text-green-600 font-medium">Active</div>
                  )}
                </Button>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;