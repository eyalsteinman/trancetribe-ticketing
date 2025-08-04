import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { User } from '@supabase/supabase-js';

interface Party {
  id: string;
  name: string;
  date: string;
  is_active: boolean;
}

interface UserDashboardProps {
  user: User;
}

const UserDashboard = ({ user }: UserDashboardProps) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentParty, setCurrentParty] = useState<Party | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadExistingQR();
    loadCurrentParty();
  }, []);

  const loadCurrentParty = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('parties')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setCurrentParty(data);
      }
    } catch (error) {
      // No active party found
    }
  };

  const loadExistingQR = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('qr_codes')
        .select('code')
        .eq('user_id', user.id)
        .eq('is_scanned', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setQrCode(data.code);
      }
    } catch (error) {
      // No existing QR code found
    }
  };

  const generateQRCode = async () => {
    setLoading(true);
    try {
      // Generate a unique QR code
      const qrData = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await (supabase as any)
        .from('qr_codes')
        .insert({
          user_id: user.id,
          code: qrData
        });

      if (error) {
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
    await supabase.auth.signOut();
  };

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
            <CardTitle>Your QR Code</CardTitle>
            {currentParty && (
              <div className="text-center space-y-1">
                <div className="text-lg font-semibold">{currentParty.name}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(currentParty.date).toLocaleDateString()}
                </div>
              </div>
            )}
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
                  disabled={loading || !currentParty}
                  className="w-full py-4 text-lg"
                >
                  {loading ? "Generating..." : "Generate QR Code"}
                </Button>
                {!currentParty && (
                  <p className="text-sm text-muted-foreground">
                    No active party found. Please wait for an admin to create a party.
                  </p>
                )}
                {currentParty && !qrCode && (
                  <p className="text-sm text-muted-foreground">
                    Click to generate your unique QR code for {currentParty.name}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;