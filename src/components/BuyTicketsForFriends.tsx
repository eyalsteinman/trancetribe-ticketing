import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, X } from 'lucide-react';

interface BuyTicketsForFriendsProps {
  user: any;
  party: any;
  onBack: () => void;
}

const BuyTicketsForFriends = ({ user, party, onBack }: BuyTicketsForFriendsProps) => {
  const [friendCodes, setFriendCodes] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addCodeField = () => {
    setFriendCodes([...friendCodes, '']);
  };

  const removeCodeField = (index: number) => {
    setFriendCodes(friendCodes.filter((_, i) => i !== index));
  };

  const updateCode = (index: number, value: string) => {
    const newCodes = [...friendCodes];
    newCodes[index] = value;
    setFriendCodes(newCodes);
  };

  const generateTicketsForFriends = async () => {
    const validCodes = friendCodes.filter(code => code.trim().length === 6);
    
    if (validCodes.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one valid 6-digit friend code",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Verify friend codes exist and get user IDs
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, personal_code, display_name, email')
        .in('personal_code', validCodes);

      if (profileError || !profiles || profiles.length === 0) {
        toast({
          title: "Error", 
          description: "No valid friend codes found",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Check if any of these users already have QR codes for this party
      const { data: existingQRs } = await supabase
        .from('qr_codes')
        .select('user_id')
        .eq('party_id', party.id)
        .in('user_id', profiles.map(p => p.user_id));

      const usersWithQRs = existingQRs?.map(qr => qr.user_id) || [];
      const profilesWithoutQRs = profiles.filter(p => !usersWithQRs.includes(p.user_id));

      if (profilesWithoutQRs.length === 0) {
        toast({
          title: "Info",
          description: "All selected friends already have QR codes for this party",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Generate QR codes for friends
      const qrCodes = profilesWithoutQRs.map(profile => ({
        user_id: profile.user_id,
        party_id: party.id,
        code: `${profile.personal_code}-${party.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        is_approved: false,
        is_scanned: false,
        auto_approved: false
      }));

      const { error: insertError } = await supabase
        .from('qr_codes')
        .insert(qrCodes);

      if (insertError) {
        toast({
          title: "Error",
          description: "Failed to generate tickets for friends",
          variant: "destructive"
        });
      } else {
        // Send QR codes to friends via email
        for (let i = 0; i < profilesWithoutQRs.length; i++) {
          const profile = profilesWithoutQRs[i];
          const qrCode = qrCodes[i];
          
          try {
            await supabase.functions.invoke('send-qr-code-email', {
              body: {
                to: profile.email,
                qrCode: qrCode.code,
                partyName: party.name,
                userName: profile.display_name || profile.email,
                partyDate: new Date(party.date).toLocaleDateString('en-GB'),
                productionName: 'Event'
              }
            });
          } catch (emailError) {
            console.error(`Failed to send email to ${profile.email}:`, emailError);
          }
        }

        toast({
          title: "Success",
          description: `Generated ${profilesWithoutQRs.length} tickets for friends! QR codes sent to their emails.`,
        });
        onBack();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate tickets for friends",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Buy Tickets for Friends</h1>
          <Button variant="outline" onClick={onBack} className="whitespace-nowrap">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Party: {party.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your friends' personal codes to generate tickets for them. 
              The tickets will be sent to admin for approval.
            </p>

            {friendCodes.map((code, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Enter 6-digit friend code"
                  value={code}
                  onChange={(e) => updateCode(index, e.target.value)}
                  maxLength={6}
                  className="flex-1"
                />
                {friendCodes.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCodeField(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addCodeField}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Friend
            </Button>

            <Button
              onClick={generateTicketsForFriends}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Generating..." : "Generate Tickets for Friends"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BuyTicketsForFriends;