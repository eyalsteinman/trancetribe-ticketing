import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/contexts/BackgroundContext';
import { ArrowLeft, Edit, Trash2, Upload, Save, X, ArrowUpDown } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import Footer from '@/components/ui/footer';

interface ManageProductionsProps {
  onBack: () => void;
}

interface Production {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  vip_description: string | null;
  vip_price: number | null;
  insurance_description: string | null;
  insurance_price: number | null;
  insurance_enabled: boolean;
}

const ManageProductions = ({ onBack }: ManageProductionsProps) => {
  const [productions, setProductions] = useState<Production[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVipDescription, setEditVipDescription] = useState('');
  const [editVipPrice, setEditVipPrice] = useState('');
  const [editInsuranceDescription, setEditInsuranceDescription] = useState('');
  const [editInsurancePrice, setEditInsurancePrice] = useState('');
  const [editInsuranceEnabled, setEditInsuranceEnabled] = useState(true);
  const [editLogo, setEditLogo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortAscending, setSortAscending] = useState(true);
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  const loadProductions = async () => {
    const { data, error } = await (supabase as any)
      .from('productions')
      .select('id, name, description, logo_url, vip_description, vip_price, insurance_description, insurance_price, insurance_enabled')
      .order('created_at', { ascending: sortAscending });
    if (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to load productions', variant: 'destructive' });
    } else {
      setProductions(data || []);
    }
  };

  useEffect(() => { loadProductions(); }, [sortAscending]);

  const startEdit = (p: Production) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditDescription(p.description || '');
    setEditVipDescription(p.vip_description || '');
    setEditVipPrice(p.vip_price?.toString() || '');
    setEditInsuranceDescription(p.insurance_description || '');
    setEditInsurancePrice(p.insurance_price?.toString() || '');
    setEditInsuranceEnabled(p.insurance_enabled);
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
        vip_description: editVipDescription.trim() || null,
        vip_price: editVipPrice ? parseFloat(editVipPrice) : null,
        insurance_description: editInsuranceDescription.trim() || null,
        insurance_price: editInsurancePrice ? parseFloat(editInsurancePrice) : null,
        insurance_enabled: editInsuranceEnabled
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
        <div className="flex items-center justify-between w-full py-4">
          <h1 className="text-2xl font-bold text-foreground">
            Manage Productions
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortAscending(!sortAscending)}
              className="text-xs border-foreground/20 bg-background/50 backdrop-blur-sm text-foreground hover:bg-foreground/10"
            >
              <ArrowUpDown className="h-4 w-4 mr-1" />
              {sortAscending ? "Latest First" : "Oldest First"}
            </Button>
            <Button 
              variant="outline" 
              onClick={onBack} 
              className="flex items-center gap-2 px-3 py-2 h-auto text-sm font-medium border-foreground/20 bg-background/50 backdrop-blur-sm text-foreground hover:bg-foreground/10 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        {productions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">No productions found.</CardContent>
          </Card>
        ) : (
          productions.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle>
                  {editingId === p.id ? (
                    <div className="space-y-4">
                      <div className="text-lg font-bold">{editName}</div>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" onClick={saveEdit} disabled={loading}><Save className="h-4 w-4 mr-1" />Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X className="h-4 w-4 mr-1" />Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span>{p.name}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" aria-label="Edit production" onClick={() => startEdit(p)}><Edit className="h-4 w-4 mr-1" />Edit</Button>
                        <Button size="sm" className="bg-destructive hover:bg-destructive border-destructive text-foreground" onClick={() => deleteProduction(p.id)}><Trash2 className="h-4 w-4 mr-1 text-foreground" /><span className="text-foreground">Delete</span></Button>
                      </div>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingId === p.id ? (
                  <>
                    <div>
                      <label className="text-sm font-medium">Production Name</label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
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
                      <label className="text-sm font-medium">VIP Subscription Price (ILS)</label>
                      <Input 
                        type="number"
                        min="0"
                        step="0.5"
                        value={editVipPrice}
                        onChange={(e) => setEditVipPrice(e.target.value)}
                        placeholder="Enter price for VIP subscription"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!editInsuranceEnabled}
                          onChange={(e) => setEditInsuranceEnabled(!e.target.checked)}
                          className="rounded"
                        />
                        Don't offer insurance
                      </label>
                    </div>
                    {editInsuranceEnabled && (
                      <>
                        <div>
                          <label className="text-sm font-medium">Insurance Description</label>
                          <textarea
                            rows={4}
                            value={editInsuranceDescription}
                            onChange={(e) => setEditInsuranceDescription(e.target.value)}
                            placeholder="Describe what insurance coverage this production offers"
                            className="w-full border rounded-md p-2"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Insurance Price (ILS)</label>
                          <Input 
                            type="number"
                            min="0"
                            step="0.5"
                            value={editInsurancePrice}
                            onChange={(e) => setEditInsurancePrice(e.target.value)}
                            placeholder="Enter price for insurance"
                          />
                        </div>
                      </>
                    )}
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
                      {(editLogo || p.logo_url) && (
                        <div className="mt-2">
                          <img 
                            src={editLogo ? URL.createObjectURL(editLogo) : p.logo_url} 
                            alt="Production logo preview" 
                            className="w-full h-auto object-contain rounded border max-h-32"
                          />
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {p.logo_url && (
                      <img src={p.logo_url} alt={`${p.name} logo`} className="w-full h-auto object-contain rounded max-h-32" />
                    )}
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">{p.description || 'No description.'}</div>
                    {p.vip_description && (
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap border-t pt-2">
                        <strong>VIP Benefits:</strong> {p.vip_description}
                      </div>
                    )}
                    {p.vip_price && (
                      <div className="text-sm text-muted-foreground border-t pt-2">
                        <strong>VIP Price:</strong> ₪{p.vip_price}
                      </div>
                    )}
                    {p.insurance_enabled && p.insurance_description && (
                      <div className="text-sm text-muted-foreground border-t pt-2">
                        <strong>Insurance:</strong> {p.insurance_description}
                      </div>
                    )}
                    {p.insurance_enabled && p.insurance_price && (
                      <div className="text-sm text-muted-foreground border-t pt-2">
                        <strong>Insurance Price:</strong> ₪{p.insurance_price}
                      </div>
                    )}
                    {!p.insurance_enabled && (
                      <div className="text-sm text-muted-foreground border-t pt-2">
                        <strong>Insurance:</strong> Not offered
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))
        )}
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default ManageProductions;
