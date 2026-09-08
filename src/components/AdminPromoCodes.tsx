import { useEffect, useState } from 'react';
import AppLayout from '@/components/ui/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RtlInput from '@/components/RtlInput';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, TicketPercent } from 'lucide-react';

interface AdminPromoCodesProps {
  onBack: () => void;
}

interface PromoCode {
  id: string;
  code: string;
  party_id: string | null;
  discount_percent: number | null;
  discount_amount: number | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
}

const AdminPromoCodes = ({ onBack }: AdminPromoCodesProps) => {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [parties, setParties] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState('');
  const [partyId, setPartyId] = useState<string>('all');
  const [percent, setPercent] = useState('');
  const [amount, setAmount] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: codeRows }, { data: partyRows }] = await Promise.all([
        supabase
          .from('promo_codes')
          .select('id, code, party_id, discount_percent, discount_amount, max_uses, used_count, is_active, expires_at')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('parties').select('id, name').eq('created_by', user.id).order('date', { ascending: false }),
      ]);

      setCodes((codeRows || []) as PromoCode[]);
      setParties(partyRows || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async () => {
    if (!code.trim()) {
      toast({ title: 'Error', description: 'Enter a code', variant: 'destructive' });
      return;
    }
    if (!percent && !amount) {
      toast({ title: 'Error', description: 'Set a percentage or a fixed discount', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      const { error } = await supabase.from('promo_codes').insert({
        code: code.trim().toUpperCase(),
        party_id: partyId === 'all' ? null : partyId,
        discount_percent: percent ? Number(percent) : null,
        discount_amount: amount ? Number(amount) : null,
        max_uses: maxUses ? Number(maxUses) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        created_by: user.id,
      });
      if (error) throw error;

      toast({ title: 'Code created' });
      setCode('');
      setPercent('');
      setAmount('');
      setMaxUses('');
      setExpiresAt('');
      setPartyId('all');
      await load();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (promo: PromoCode) => {
    const { error } = await supabase
      .from('promo_codes')
      .update({ is_active: !promo.is_active })
      .eq('id', promo.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setCodes((prev) => prev.map((c) => (c.id === promo.id ? { ...c, is_active: !c.is_active } : c)));
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('promo_codes').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setCodes((prev) => prev.filter((c) => c.id !== id));
    toast({ title: 'Code deleted' });
  };

  return (
    <AppLayout title="Promo Codes" onBack={onBack}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TicketPercent className="h-5 w-5" aria-hidden="true" />
              New code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RtlInput value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code (e.g. TRANCE20)" aria-label="Code" />
            <Select value={partyId} onValueChange={setPartyId}>
              <SelectTrigger aria-label="Event">
                <SelectValue placeholder="All my events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All my events</SelectItem>
                {parties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <RtlInput type="number" value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="Discount %" aria-label="Discount percent" />
              <RtlInput type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Discount ILS" aria-label="Discount amount" />
              <RtlInput type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Max uses" aria-label="Max uses" />
              <RtlInput type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} aria-label="Expiry date" />
            </div>
            <Button className="w-full" onClick={create} disabled={saving}>
              {saving ? 'Creating…' : 'Create code'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My codes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Loading…
              </div>
            ) : codes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No promo codes yet.</p>
            ) : (
              codes.map((c) => (
                <div key={c.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge>{c.code}</Badge>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={c.is_active}
                        onCheckedChange={() => toggleActive(c)}
                        aria-label={`Activate ${c.code}`}
                      />
                      <Button variant="ghost" size="sm" onClick={() => remove(c.id)} aria-label={`Delete ${c.code}`}>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.discount_percent ? `${c.discount_percent}% off` : ''}
                    {c.discount_percent && c.discount_amount ? ' + ' : ''}
                    {c.discount_amount ? `${c.discount_amount} ILS off` : ''}
                    {' · '}
                    {c.party_id ? parties.find((p) => p.id === c.party_id)?.name || 'One event' : 'All my events'}
                    {' · used '}
                    {c.used_count}
                    {c.max_uses ? ` / ${c.max_uses}` : ''}
                    {c.expires_at ? ` · until ${new Date(c.expires_at).toLocaleDateString('en-GB')}` : ''}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AdminPromoCodes;
