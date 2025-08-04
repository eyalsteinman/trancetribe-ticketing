import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';

interface AdminDashboardProps {
  user: User;
}

interface ScannedUser {
  id: string;
  user_id: string;
  scanned_at: string;
  profiles: {
    display_name: string;
  } | null;
}

const AdminDashboard = ({ user }: AdminDashboardProps) => {
  const [qrInput, setQrInput] = useState('');
  const [scannedUsers, setScannedUsers] = useState<ScannedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadScannedUsers();
  }, []);

  const loadScannedUsers = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('qr_codes')
        .select(`
          id,
          user_id,
          scanned_at,
          profiles!inner(display_name)
        `)
        .eq('is_scanned', true)
        .eq('scanned_by', user.id)
        .order('scanned_at', { ascending: false });

      if (error) {
        console.error('Error loading scanned users:', error);
      } else {
        setScannedUsers(data || []);
      }
    } catch (error) {
      console.error('Error loading scanned users:', error);
    }
  };

  const scanQRCode = async () => {
    if (!qrInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a QR code",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // First check if QR code exists and is not already scanned
      const { data: qrData, error: qrError } = await (supabase as any)
        .from('qr_codes')
        .select('id, user_id, is_scanned')
        .eq('code', qrInput.trim())
        .single();

      if (qrError || !qrData) {
        toast({
          title: "Error",
          description: "Invalid QR code",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      if (qrData.is_scanned) {
        toast({
          title: "Error",
          description: "This QR code has already been scanned",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Mark QR code as scanned
      const { error: updateError } = await (supabase as any)
        .from('qr_codes')
        .update({
          is_scanned: true,
          scanned_at: new Date().toISOString(),
          scanned_by: user.id
        })
        .eq('id', qrData.id);

      if (updateError) {
        toast({
          title: "Error",
          description: updateError.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "QR code scanned successfully!",
        });
        setQrInput('');
        loadScannedUsers(); // Refresh the list
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to scan QR code",
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Scan QR Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Enter QR code or scan with camera"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && scanQRCode()}
              />
              <Button 
                onClick={scanQRCode}
                disabled={loading || !qrInput.trim()}
                className="w-full"
              >
                {loading ? "Scanning..." : "Scan QR Code"}
              </Button>
              <p className="text-sm text-muted-foreground">
                For now, manually enter the QR code. Camera scanning will be added later.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scanned Users</CardTitle>
              <Badge variant="secondary">{scannedUsers.length} users scanned</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {scannedUsers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No users scanned yet
                  </p>
                ) : (
                  scannedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex justify-between items-center p-2 border rounded"
                    >
                      <span className="font-medium">
                        {user.profiles?.display_name || 'Unknown User'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(user.scanned_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;