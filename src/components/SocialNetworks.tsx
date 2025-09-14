import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Save } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SocialNetworksProps {
  userId: string;
  onBack: () => void;
  onSaved?: () => void;
  isFromTicketPurchase?: boolean;
}

type Platform = 'facebook' | 'instagram' | 'tiktok' | 'x';

const platforms: { key: Platform; label: string; placeholder: string }[] = [
  { key: 'facebook', label: 'Facebook profile URL', placeholder: 'https://facebook.com/your-profile' },
  { key: 'instagram', label: 'Instagram profile URL', placeholder: 'https://instagram.com/your-profile' },
  { key: 'tiktok', label: 'TikTok profile URL', placeholder: 'https://tiktok.com/@your-handle' },
  { key: 'x', label: 'X (Twitter) profile URL', placeholder: 'https://x.com/your-handle' },
];

const SocialNetworks = ({ userId, onBack, onSaved, isFromTicketPurchase }: SocialNetworksProps) => {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<Platform, string>>({
    facebook: '',
    instagram: '',
    tiktok: '',
    x: '',
  });
  const [loading, setLoading] = useState(false);
  const [savingStates, setSavingStates] = useState<Record<Platform, boolean>>({
    facebook: false,
    instagram: false,
    tiktok: false,
    x: false,
  });

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

  const validateUrl = (url: string, platform: Platform): boolean => {
    if (!url.trim()) return true; // Empty URLs are valid (optional)
    
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      
      switch (platform) {
        case 'facebook':
          return domain === 'facebook.com' || domain === 'www.facebook.com' || domain === 'm.facebook.com';
        case 'instagram':
          return domain === 'instagram.com' || domain === 'www.instagram.com';
        case 'tiktok':
          return domain === 'tiktok.com' || domain === 'www.tiktok.com';
        case 'x':
          return domain === 'x.com' || domain === 'www.x.com' || domain === 'twitter.com' || domain === 'www.twitter.com';
        default:
          return false;
      }
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    // Validate all URLs before saving
    const invalidPlatforms: string[] = [];
    platforms.forEach((p) => {
      if (values[p.key]?.trim() && !validateUrl(values[p.key], p.key)) {
        invalidPlatforms.push(p.label);
      }
    });

    if (invalidPlatforms.length > 0) {
      toast({ 
        title: 'Invalid URLs', 
        description: `Please enter valid URLs for: ${invalidPlatforms.join(', ')}`, 
        variant: 'destructive' 
      });
      return;
    }

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
      
      // If this was triggered from ticket purchase flow, call onSaved
      if (isFromTicketPurchase && onSaved) {
        onSaved();
      }
    } catch (e: any) {
      console.error('Save socials error', e);
      toast({ title: 'Error', description: e.message || 'Failed to save socials', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIndividual = async (platform: Platform) => {
    // Validate URL for this platform
    if (values[platform]?.trim() && !validateUrl(values[platform], platform)) {
      toast({ 
        title: 'Invalid URL', 
        description: `Please enter a valid URL for ${platforms.find(p => p.key === platform)?.label}`, 
        variant: 'destructive' 
      });
      return;
    }

    setSavingStates(prev => ({ ...prev, [platform]: true }));
    try {
      // Remove existing row for this platform
      const { error: delErr } = await (supabase as any)
        .from('user_socials')
        .delete()
        .eq('user_id', userId)
        .eq('platform', platform);
      if (delErr) throw delErr;

      // Insert new row if URL is not empty
      if (values[platform]?.trim()) {
        const { error: insErr } = await (supabase as any)
          .from('user_socials')
          .insert({ user_id: userId, platform, url: values[platform].trim() });
        if (insErr) throw insErr;
      }

      toast({ title: 'Saved', description: `${platforms.find(p => p.key === platform)?.label} updated.` });
    } catch (e: any) {
      console.error('Save individual social error', e);
      toast({ title: 'Error', description: e.message || 'Failed to save social link', variant: 'destructive' });
    } finally {
      setSavingStates(prev => ({ ...prev, [platform]: false }));
    }
  };

  return (
    <div className="min-h-screen p-4">
      <PageHeader
        title="Social Networks"
        onBack={onBack}
      />
      
      <div className="max-w-md mx-auto pt-20 space-y-6 text-left">

        {platforms.map((p) => (
          <Card key={p.key}>
            <CardHeader>
              <CardTitle className="text-sm font-normal opacity-80">{p.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder={p.placeholder}
                value={values[p.key]}
                onChange={(e) => handleChange(p.key, e.target.value)}
                inputMode="url"
              />
              <Button 
                onClick={() => handleSaveIndividual(p.key)}
                disabled={savingStates[p.key]}
                size="sm"
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {savingStates[p.key] ? 'Saving...' : 'Save'}
              </Button>
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-center">
          <Button onClick={handleSave} disabled={loading} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {loading ? 'Saving All...' : 'Save All'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SocialNetworks;
