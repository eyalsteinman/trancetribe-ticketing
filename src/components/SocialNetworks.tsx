import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SocialNetworksProps {
  userId: string;
  onBack: () => void;
}

type Platform = 'facebook' | 'instagram' | 'tiktok' | 'x';

const platforms: { key: Platform; label: string; placeholder: string }[] = [
  { key: 'facebook', label: 'Facebook profile URL', placeholder: 'https://facebook.com/your-profile' },
  { key: 'instagram', label: 'Instagram profile URL', placeholder: 'https://instagram.com/your-profile' },
  { key: 'tiktok', label: 'TikTok profile URL', placeholder: 'https://tiktok.com/@your-handle' },
  { key: 'x', label: 'X (Twitter) profile URL', placeholder: 'https://x.com/your-handle' },
];

const SocialNetworks = ({ userId, onBack }: SocialNetworksProps) => {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<Platform, string>>({
    facebook: '',
    instagram: '',
    tiktok: '',
    x: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('user_socials')
          .select('platform, url')
          .eq('user_id', userId);
        if (!error && data) {
          const next = { ...values } as Record<Platform, string>;
          (data as any[]).forEach((row) => {
            const p = row.platform as Platform;
            if (p in next) next[p] = row.url || '';
          });
          setValues(next);
        }
      } catch (e) {
        console.error('Failed to load socials', e);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleChange = (key: Platform, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Remove existing rows for these platforms
      const activePlatforms = platforms.map((p) => p.key);
      const { error: delErr } = await (supabase as any)
        .from('user_socials')
        .delete()
        .eq('user_id', userId)
        .in('platform', activePlatforms);
      if (delErr) throw delErr;

      // Insert new rows for non-empty inputs
      const rows = activePlatforms
        .filter((p) => values[p as Platform]?.trim())
        .map((p) => ({ user_id: userId, platform: p, url: values[p as Platform].trim() }));

      if (rows.length > 0) {
        const { error: insErr } = await (supabase as any)
          .from('user_socials')
          .insert(rows);
        if (insErr) throw insErr;
      }

      toast({ title: 'Saved', description: 'Social links updated.' });
    } catch (e: any) {
      console.error('Save socials error', e);
      toast({ title: 'Error', description: e.message || 'Failed to save socials', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto space-y-6 text-left">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack} aria-label="Back" className="absolute top-4 right-4 z-[9999] on-color back-button">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Social Networks</h1>
        </div>

        {platforms.map((p) => (
          <Card key={p.key}>
            <CardHeader>
              <CardTitle className="text-sm font-normal opacity-80">{p.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder={p.placeholder}
                value={values[p.key]}
                onChange={(e) => handleChange(p.key, e.target.value)}
                inputMode="url"
              />
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SocialNetworks;
