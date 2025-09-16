import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import { useBackground } from '@/contexts/BackgroundContext';
import Footer from '@/components/ui/footer';
import TicketManager from './TicketManager';

const socialOptions = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'x', label: 'X (Twitter)' },
] as const;

interface CreatePartyProps {
  onBack: () => void;
}

const CreateParty = ({ onBack }: CreatePartyProps) => {
  const [partyName, setPartyName] = useState('');
  const [partyDate, setPartyDate] = useState('');
  const [description, setDescription] = useState('');
  
  const [isFree, setIsFree] = useState<boolean>(false);
  const [requiredSocials, setRequiredSocials] = useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [selectedProductionId, setSelectedProductionId] = useState<string>('');
  const [productions, setProductions] = useState<{ id: string; name: string }[]>([]);
  const [ticketCount, setTicketCount] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [maxTicketsPerUser, setMaxTicketsPerUser] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
    }
  };

  useEffect(() => {
    const loadProductions = async () => {
      const { data, error } = await (supabase as any)
        .from('productions')
        .select('id, name')
        .order('name');
      if (!error && data) setProductions(data);
    };
    loadProductions();
  }, []);

  const uploadPhoto = async (): Promise<string | null> => {
    if (!selectedPhoto) return null;

    const fileExt = selectedPhoto.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('party-photos')
      .upload(fileName, selectedPhoto);

    if (error) {
      console.error('Photo upload error:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('party-photos')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleCreateParty = async () => {
    if (!partyName.trim() || !partyDate) {
      toast({
        title: "Error",
        description: "Please fill in both party name and date",
        variant: "destructive"
      });
      return;
    }

    // Validate ticket types don't exceed total tickets
    if (ticketCount && ticketTypes.length > 0) {
      const totalTicketTypesQuantity = ticketTypes.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0);
      if (totalTicketTypesQuantity > Number(ticketCount)) {
        toast({
          title: "Error",
          description: `Total ticket types quantity (${totalTicketTypesQuantity}) exceeds the total tickets available (${ticketCount})`,
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);
    try {
      // Upload photo if selected
      let photoUrl = null;
      if (selectedPhoto) {
        photoUrl = await uploadPhoto();
      }

      // First, mark all existing parties as inactive
      await (supabase as any)
        .from('parties')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

      // Create new party
      const { data: { user } } = await supabase.auth.getUser();
      
      const optionalSocials = requiredSocials.filter(s => s.includes('_optional')).map(s => s.replace('_optional', ''));
      const obligatorySocials = requiredSocials.filter(s => s.includes('_obligatory')).map(s => s.replace('_obligatory', ''));
      
      console.log('Saving social networks:', { optionalSocials, obligatorySocials, requiredSocials });
      
      const { data: partyData, error: partyError } = await (supabase as any)
        .from('parties')
        .insert({
          name: partyName.trim(),
          date: partyDate,
          created_by: user?.id,
          is_active: true,
          photo_url: photoUrl,
          description: description.trim() || null,
          price: null, // Price now handled by ticket types
          is_free: isFree,
          optional_socials: optionalSocials,
          obligatory_socials: obligatorySocials,
          production_id: selectedProductionId || null,
          ticket_count: ticketCount ? Number(ticketCount) : null,
          start_time: startTime || null,
          end_time: endTime || null,
          max_tickets_per_user: maxTicketsPerUser
        })
        .select()
        .single();

      if (partyError) {
        toast({
          title: "Error",
          description: partyError.message,
          variant: "destructive"
        });
        return;
      }

      // Save ticket types if any were created
      if (ticketTypes.length > 0 && partyData) {
        const ticketTypesToInsert = ticketTypes.map(ticket => ({
          party_id: partyData.id,
          label: ticket.label,
          price: ticket.price || 0,
          quantity: ticket.quantity || 0
        }));

        const { error: ticketTypesError } = await supabase
          .from('ticket_types')
          .insert(ticketTypesToInsert);

        if (ticketTypesError) {
          console.error('Error saving ticket types:', ticketTypesError);
          toast({
            title: "Warning",
            description: "Party created but ticket types failed to save. Please edit the party to add ticket types.",
            variant: "destructive"
          });
        }
      }

      toast({
        title: "Success",
        description: "Party created successfully!",
      });

      // Reset form
      setPartyName('');
      setPartyDate('');
      setSelectedPhoto(null);
      setTicketCount('');
      setStartTime('');
      setEndTime('');
      setTicketTypes([]);
      
      // Show success popup for 2 seconds, then return
      setTimeout(() => {
        onBack();
      }, 2000);
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
    <div className="min-h-screen bg-gradient-mesh relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 animate-pulse-slow"></div>
      
      <div className="relative z-10 min-h-screen p-4">
        <div className="container mx-auto max-w-md">
          <PageHeader
            title="Create Party"
            onBack={onBack}
          />
          
          <div className="pt-20 space-y-6">
            <Card>
          <CardHeader>
            <CardTitle>Party Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Production</label>
              <select
                className="w-full p-2 border rounded-md"
                value={selectedProductionId}
                onChange={(e) => setSelectedProductionId(e.target.value)}
              >
                <option value="">Select production (optional)</option>
                {productions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Time</label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Time</label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="w-full border rounded-md p-2"
                rows={4}
                placeholder="Write about the party..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isFree"
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="isFree" className="text-sm">Free Party</label>
            </div>
            <div>
              <label className="text-sm font-medium">Number of Tickets Available</label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 100"
                value={ticketCount}
                onChange={(e) => setTicketCount(e.target.value)}
              />
            </div>

<TicketManager
  tickets={ticketTypes}
  onChange={setTicketTypes}
  maxTicketsPerUser={maxTicketsPerUser}
  onMaxTicketsChange={setMaxTicketsPerUser}
  totalTickets={ticketCount ? Number(ticketCount) : undefined}
/>

            <div>
              <label className="text-sm font-medium">Social Networks Required</label>
              <div className="grid grid-cols-1 gap-3 mt-2">
                {socialOptions.map((opt) => (
                  <div key={opt.key} className="space-y-2">
                    <div className="font-medium text-sm">{opt.label}</div>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={requiredSocials.includes(`${opt.key}_optional`)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRequiredSocials([...requiredSocials.filter(s => !s.startsWith(opt.key)), `${opt.key}_optional`]);
                            } else {
                              setRequiredSocials(requiredSocials.filter((s) => s !== `${opt.key}_optional`));
                            }
                          }}
                          className="h-4 w-4"
                        />
                        Optional (either)
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={requiredSocials.includes(`${opt.key}_obligatory`)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRequiredSocials([...requiredSocials.filter(s => !s.startsWith(opt.key)), `${opt.key}_obligatory`]);
                            } else {
                              setRequiredSocials(requiredSocials.filter((s) => s !== `${opt.key}_obligatory`));
                            }
                          }}
                          className="h-4 w-4"
                        />
                        Obligatory
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Party Photo (Optional)</label>
              <div className="flex items-center gap-2">
                <Input
                  id="partyPhoto"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('partyPhoto')?.click()}
                  className="flex items-center gap-2 text-foreground"
                >
                  <Upload className="h-4 w-4" />
                  <span className="truncate max-w-32">
                    {selectedPhoto ? selectedPhoto.name : 'Upload Photo'}
                  </span>
                </Button>
                {selectedPhoto && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedPhoto(null)}
                    className="text-destructive"
                  >
                    Remove
                  </Button>
                )}
              </div>
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
            
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateParty;