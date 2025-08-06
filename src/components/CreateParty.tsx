import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';

interface CreatePartyProps {
  onBack: () => void;
}

const CreateParty = ({ onBack }: CreatePartyProps) => {
  const [partyName, setPartyName] = useState('');
  const [partyDate, setPartyDate] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateParty = async () => {
    if (!partyName.trim() || !partyDate) {
      toast({
        title: "Error",
        description: "Please fill in both party name and date",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // First, mark all existing parties as inactive
      await (supabase as any)
        .from('parties')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

      // Create new party
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from('parties')
        .insert({
          name: partyName.trim(),
          date: partyDate,
          created_by: user?.id,
          is_active: true
        });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Party created successfully!",
        });
        onBack();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create party",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Create Party</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Party Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Party Name</label>
              <Input
                placeholder="Enter party name"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Party Date</label>
              <Input
                type="date"
                value={partyDate}
                onChange={(e) => setPartyDate(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleCreateParty}
              disabled={loading || !partyName.trim() || !partyDate}
              className="w-full"
            >
              {loading ? "Creating..." : "Create Party"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateParty;