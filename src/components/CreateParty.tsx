import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Upload } from 'lucide-react';
import { useBackground } from '@/contexts/BackgroundContext';

interface CreatePartyProps {
  onBack: () => void;
}

const CreateParty = ({ onBack }: CreatePartyProps) => {
  const [partyName, setPartyName] = useState('');
  const [partyDate, setPartyDate] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [isFree, setIsFree] = useState<boolean>(false);
  const [requiredSocials, setRequiredSocials] = useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
    }
  };

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
          price: price ? Number(price) : null,
          is_free: isFree,
          required_socials: requiredSocials
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
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 
            className="text-2xl font-bold"
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Price (ILS)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="e.g. 50"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="flex items-end gap-2">
                <input
                  id="isFree"
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="isFree" className="text-sm">Free Party</label>
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
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {selectedPhoto ? selectedPhoto.name : 'Upload Photo'}
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