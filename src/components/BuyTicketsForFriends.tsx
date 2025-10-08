import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, X } from 'lucide-react';
import BuyTicket from './BuyTicket';

interface BuyTicketsForFriendsProps {
  user: any;
  party: any;
  onBack: () => void;
}

const BuyTicketsForFriends = ({ user, party, onBack }: BuyTicketsForFriendsProps) => {
  const [friendCodes, setFriendCodes] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [validatedFriends, setValidatedFriends] = useState<any[]>([]);
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

  const checkRequiredSocials = async () => {
    if (!party.required_socials || party.required_socials.length === 0) {
      return true;
    }

    const { data: userSocials } = await supabase
      .from('user_socials')
      .select('platform')
      .eq('user_id', user.id);

    const userPlatforms = userSocials?.map(s => s.platform) || [];
    const missingSocials = party.required_socials.filter(
      required => !userPlatforms.includes(required)
    );

    if (missingSocials.length > 0) {
      toast({
        title: "Social Media Required",
        description: `Please add your ${missingSocials.join(', ')} account(s) in your profile before generating tickets.`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const validateFriendsAndProceed = async () => {
    const canGenerate = await checkRequiredSocials();
    if (!canGenerate) return;

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
      // Use secure lookup for friend profiles
      const profileLookups = await Promise.all(
        validCodes.map(code => 
          supabase.rpc('lookup_friend_by_personal_code', { _personal_code: code })
        )
      );
      
      const profiles = profileLookups
        .filter(result => result.data && !result.error)
        .map(result => result.data) as any[];
      const profileError = profileLookups.find(result => result.error)?.error;

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

      setValidatedFriends(profilesWithoutQRs);
      
      // If party is free, generate tickets directly
      if (party.is_free) {
        await generateFreeTickets(profilesWithoutQRs);
      } else {
        // Show payment interface
        setShowPayment(true);
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Error",
        description: "Failed to validate friend codes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateFreeTickets = async (profiles: any[]) => {
    try {
      // Generate QR codes for friends individually to avoid batching issues
      for (let i = 0; i < profiles.length; i++) {
        const profile = profiles[i];
        const qrCode = {
          user_id: profile.user_id,
          party_id: party.id,
          code: `${profile.personal_code}-${party.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          is_approved: true, // Auto-approve free tickets
          is_scanned: false,
          auto_approved: true,
          ticket_type_id: null // No ticket type for free tickets
        };

        const { error: insertError } = await supabase
          .from('qr_codes')
          .insert(qrCode);

        if (insertError) {
          console.error(`Failed to generate ticket for ${profile.display_name}:`, insertError);
          toast({
            title: "Error",
            description: `Failed to generate ticket for ${profile.display_name || profile.email}`,
            variant: "destructive"
          });
          continue;
        }

        // Send QR code via email
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
        description: `Generated ${profiles.length} free tickets for friends! QR codes sent to their emails.`,
      });
      onBack();
    } catch (error) {
      console.error('Error generating free tickets:', error);
      toast({
        title: "Error",
        description: "Failed to generate free tickets",
        variant: "destructive"
      });
    }
  };

  const generatePaidTickets = async () => {
    try {
      // Generate QR codes for friends after payment
      const qrCodes = validatedFriends.map(profile => ({
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
        return;
      }

      // Send QR codes to friends via email
      for (let i = 0; i < validatedFriends.length; i++) {
        const profile = validatedFriends[i];
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
        description: `Generated ${validatedFriends.length} tickets for friends! QR codes sent to their emails.`,
      });
      onBack();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate paid tickets",
        variant: "destructive"
      });
    }
  };

  if (showPayment && !party.is_free) {
    const totalAmount = (party.price || 0) * validatedFriends.length;
    
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Payment for Friends</h1>
            <Button variant="outline" onClick={() => setShowPayment(false)} className="whitespace-nowrap">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Party: {party.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Purchasing tickets for {validatedFriends.length} friend(s):
                </p>
                {validatedFriends.map((friend, index) => (
                  <div key={index} className="text-sm font-medium">
                    • {friend.display_name || friend.email}
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span>{totalAmount} ILS</span>
                </div>
              </div>

              <BuyTicket
                ticketAmount={totalAmount}
                currency="ILS"
                adminId={party.created_by}
                partyId={party.id}
                className="w-full"
                onPaymentSuccess={generatePaidTickets}
              />
              
              <p className="text-xs text-muted-foreground text-center">
                After successful payment, QR codes will be generated and sent to your friends.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
              {!party.is_free && ` Each ticket costs ${party.price || 0} ILS.`}
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
              onClick={validateFriendsAndProceed}
              disabled={loading}
              className={`w-full ${party.is_free ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
            >
              {loading ? "Validating..." : party.is_free ? "Generate Free Tickets" : "Proceed to Payment"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BuyTicketsForFriends;