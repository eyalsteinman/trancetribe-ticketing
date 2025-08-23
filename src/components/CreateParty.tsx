import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Upload } from 'lucide-react';
import { useBackground } from '@/contexts/BackgroundContext';
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

    // Price validation is now handled by ticket types

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
      const { error } = await (supabase as any)
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
          required_socials: requiredSocials,
          production_id: selectedProductionId || null,
          ticket_count: ticketCount ? Number(ticketCount) : null,
          start_time: startTime || null,
          end_time: endTime || null,
          max_tickets_per_user: maxTicketsPerUser
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
        // Reset form
        setPartyName('');
        setPartyDate('');
        setSelectedPhoto(null);
        setTicketCount('');
        setStartTime('');
        setEndTime('');
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
            Create Party
          </h1>
        </div>

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
            />

            <div>
              <label className="text-sm font-medium">Required Social Networks</label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {socialOptions.map((opt) => (
                  <label key={opt.key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={requiredSocials.includes(opt.key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRequiredSocials([...requiredSocials, opt.key]);
                        } else {
                          setRequiredSocials(requiredSocials.filter((s) => s !== opt.key));
                        }
                      }}
                      className="h-4 w-4"
                    />
                    {opt.label}
                  </label>
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
      </div>
    </div>
  );
};

export default CreateParty;