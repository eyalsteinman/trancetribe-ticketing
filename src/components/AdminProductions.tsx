import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/contexts/BackgroundContext';
import { ArrowLeft, Plus, Upload } from 'lucide-react';

interface AdminProductionsProps {
  onBack: () => void;
}

interface Production {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
}

const AdminProductions = ({ onBack }: AdminProductionsProps) => {
  const [hasProductions, setHasProductions] = useState<boolean | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [productions, setProductions] = useState<Production[]>([]);
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  useEffect(() => {
    const checkProductions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setHasProductions(false);
      const { data, error } = await (supabase as any)
        .from('productions')
        .select('id')
        .eq('created_by', user.id)
        .limit(1);
      if (error) {
        console.error('Error checking productions', error);
        setHasProductions(false);
      } else {
        setHasProductions((data || []).length > 0);
      }
    };
    checkProductions();
  }, []);

  useEffect(() => { loadProductions(); }, []);

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return null;
    const ext = logoFile.name.split('.').pop();
    const fileName = `logo-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error } = await supabase.storage
      .from('production-logos')
      .upload(fileName, logoFile);
    if (error) throw error;
    const { data: pub } = supabase.storage.from('production-logos').getPublicUrl(fileName);
    return pub.publicUrl;
  };

  const loadProductions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setProductions([]); return; }
    const { data, error } = await (supabase as any)
      .from('productions')
      .select('id, name, description, logo_url')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setProductions(data);
  };

  const saveProduction = async () => {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Please enter a name', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      let logoUrl: string | null = null;
      if (logoFile) logoUrl = await uploadLogo();
      const { error } = await (supabase as any)
        .from('productions')
        .insert({ created_by: user.id, name: name.trim(), description: description.trim() || null, logo_url: logoUrl });
      if (error) throw error;
      toast({ title: 'Saved', description: 'Production created!' });
      setIsCreating(false);
      await loadProductions();
      setHasProductions(true);
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e.message || 'Failed to save', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor }}>
      <div className="max-w-md mx-auto space-y-6 text-left">
        <div className="relative">
          <Button variant="outline" size="icon" onClick={onBack} aria-label="Back" className="absolute top-4 right-4 z-[9999] on-color back-button">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold" style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}>My Productions</h1>
        </div>

        {!isCreating && (
          <Card>
            <CardContent className="py-12 flex flex-col items-center justify-center gap-6">
              {hasProductions === false && (
                <div className="text-muted-foreground">no productions yet</div>
              )}
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="h-24 w-24 rounded-full border flex items-center justify-center text-4xl"
                aria-label="Add production"
              >
                <Plus className="h-10 w-10" />
              </button>
            </CardContent>
          </Card>
        )}

        {!isCreating && productions.length > 0 && (
          <div className="space-y-4">
            {productions.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  {p.logo_url && (
                    <img src={p.logo_url} alt={`${p.name} logo`} className="h-12 w-12 rounded object-cover" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{p.name}</div>
                    {p.description && (
                      <div className="text-sm text-muted-foreground">{p.description}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {isCreating && (
          <Card>
            <CardHeader>
              <CardTitle>Create Production</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name your production</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Production name" />
              </div>
              <div>
                <label className="text-sm font-medium">Describe your production</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write a short description"
                  className="w-full border rounded-md p-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Upload logo</label>
                <div className="flex items-center gap-2">
                  <Input id="prodLogo" type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="hidden" />
                  <Button type="button" variant="outline" onClick={() => document.getElementById('prodLogo')?.click()} className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    {logoFile ? logoFile.name : 'Choose Logo'}
                  </Button>
                  {logoFile && (
                    <Button type="button" variant="ghost" onClick={() => setLogoFile(null)} className="text-destructive">Remove</Button>
                  )}
                </div>
              </div>
              <Button onClick={saveProduction} disabled={loading || !name.trim()} className="w-full">{loading ? 'Saving...' : 'Save'}</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminProductions;
