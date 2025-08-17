import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/contexts/BackgroundContext';
import { ArrowLeft, Edit, Trash2, Upload, Save, X } from 'lucide-react';

interface ManageProductionsProps {
  onBack: () => void;
}

interface Production {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  vip_description: string | null;
}

const ManageProductions = ({ onBack }: ManageProductionsProps) => {
  const [productions, setProductions] = useState<Production[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVipDescription, setEditVipDescription] = useState('');
  const [editLogo, setEditLogo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  const loadProductions = async () => {
    const { data, error } = await (supabase as any)
      .from('productions')
      .select('id, name, description, logo_url, vip_description')
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to load productions', variant: 'destructive' });
    } else {
      setProductions(data || []);
    }
  };

  useEffect(() => { loadProductions(); }, []);

  const startEdit = (p: Production) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditDescription(p.description || '');
    setEditVipDescription(p.vip_description || '');
    setEditLogo(null);
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!editLogo) return null;
    const ext = editLogo.name.split('.').pop();
    const fileName = `logo-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('production-logos').upload(fileName, editLogo);
    if (error) throw error;
    const { data: pub } = supabase.storage.from('production-logos').getPublicUrl(fileName);
    return pub.publicUrl;
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setLoading(true);
    try {
      let logoUrl: string | null | undefined = undefined; // undefined means do not change
      if (editLogo) logoUrl = await uploadLogo();
      const update: any = { 
        name: editName.trim(), 
        description: editDescription.trim() || null,
        vip_description: editVipDescription.trim() || null
      };
      if (logoUrl !== undefined) update.logo_url = logoUrl;
      const { error } = await (supabase as any)
        .from('productions')
        .update(update)
        .eq('id', editingId);
      if (error) throw error;
      toast({ title: 'Updated', description: 'Production updated!' });
      setEditingId(null);
      await loadProductions();
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e.message || 'Failed to update', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const deleteProduction = async (id: string) => {
    if (!confirm('Delete this production?')) return;
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('productions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Production removed.' });
      await loadProductions();
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e.message || 'Failed to delete', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor }}>
      <div className="max-w-md mx-auto space-y-6 text-left">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack} aria-label="Back" className="absolute top-4 right-4 z-[9999] on-color back-button">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 
            className="text-xl font-bold" 
            style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
          >
            Manage Productions
          </h1>
        </div>

        {productions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">No productions found.</CardContent>
          </Card>
        ) : (
          productions.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {editingId === p.id ? (
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  ) : (
                    <span>{p.name}</span>
                  )}
                  {editingId === p.id ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit} disabled={loading}><Save className="h-4 w-4 mr-1" />Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X className="h-4 w-4 mr-1" />Cancel</Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(p)}><Edit className="h-4 w-4 mr-1" />Edit</Button>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700 border-red-600 text-white" onClick={() => deleteProduction(p.id)}><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingId === p.id ? (
                  <>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        rows={4}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full border rounded-md p-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">VIP Subscription Benefits</label>
                      <textarea
                        rows={4}
                        value={editVipDescription}
                        onChange={(e) => setEditVipDescription(e.target.value)}
                        placeholder="Describe what VIP subscription gives users for this production"
                        className="w-full border rounded-md p-2"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Logo</label>
                      <div className="flex items-center gap-2">
                        <Input id={`logo-${p.id}`} type="file" accept="image/*" onChange={(e) => setEditLogo(e.target.files?.[0] || null)} className="hidden" />
                        <Button type="button" variant="outline" onClick={() => document.getElementById(`logo-${p.id}`)?.click()} className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          {editLogo ? editLogo.name : 'Upload New Logo'}
                        </Button>
                        {editLogo && (
                          <Button type="button" variant="ghost" onClick={() => setEditLogo(null)} className="text-destructive">Remove</Button>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {p.logo_url && (
                      <img src={p.logo_url} alt={`${p.name} logo`} className="w-full h-auto object-contain rounded" />
                    )}
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">{p.description || 'No description.'}</div>
                    {p.vip_description && (
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap border-t pt-2">
                        <strong>VIP Benefits:</strong> {p.vip_description}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageProductions;
