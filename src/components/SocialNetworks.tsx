import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialNetworksProps {
  userId: string;
  onBack: () => void;
}

const SocialNetworks = ({ userId, onBack }: SocialNetworksProps) => {
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`social-links-${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFacebook(parsed.facebook || '');
        setInstagram(parsed.instagram || '');
      }
    } catch {}
  }, [userId]);

  const handleSave = () => {
    localStorage.setItem(
      `social-links-${userId}`,
      JSON.stringify({ facebook, instagram })
    );
    toast({ title: 'Saved', description: 'Social links updated.' });
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Social Networks</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal opacity-80">Insert Facebook profile</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="https://facebook.com/your-profile"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              inputMode="url"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-normal opacity-80">Insert Instagram profile</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="https://instagram.com/your-profile"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              inputMode="url"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SocialNetworks;
