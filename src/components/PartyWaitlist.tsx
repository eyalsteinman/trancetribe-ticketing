import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BellRing, Loader2 } from 'lucide-react';

interface PartyWaitlistProps {
  partyId: string;
  isSoldOut?: boolean;
}

const PartyWaitlist = ({ partyId, isSoldOut = false }: PartyWaitlistProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('party_waitlist')
        .select('id, user_id, created_at')
        .eq('party_id', partyId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const rows = data || [];
      setTotal(rows.length);
      const index = rows.findIndex((r) => r.user_id === user.id);
      setEntryId(index >= 0 ? rows[index].id : null);
      setPosition(index >= 0 ? index + 1 : null);
    } catch (error: any) {
      console.error('Failed to load waiting list', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partyId]);

  const join = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in first');

      const { error } = await supabase
        .from('party_waitlist')
        .insert({ party_id: partyId, user_id: user.id });
      if (error) throw error;

      toast({ title: 'You are on the waiting list', description: "We'll alert you when tickets free up." });
      await load();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const leave = async () => {
    if (!entryId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('party_waitlist').delete().eq('id', entryId);
      if (error) throw error;
      toast({ title: 'Removed from waiting list' });
      await load();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BellRing className="h-5 w-5" aria-hidden="true" />
          Waiting List
        </CardTitle>
        {isSoldOut && <Badge variant="destructive">Sold out</Badge>}
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading…
          </div>
        ) : entryId ? (
          <>
            <p className="text-sm text-muted-foreground">
              You are number <span className="font-bold text-foreground">{position}</span> of {total} on the waiting list.
              We will alert you the moment a ticket becomes available.
            </p>
            <Button variant="outline" className="w-full" onClick={leave} disabled={saving}>
              {saving ? 'Removing…' : 'Leave waiting list'}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {isSoldOut
                ? 'This event is sold out. Join the waiting list and get alerted if a ticket frees up.'
                : 'Join the waiting list to be alerted if this event sells out and tickets free up.'}
            </p>
            <Button className="w-full" onClick={join} disabled={saving}>
              {saving ? 'Joining…' : 'Join waiting list'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PartyWaitlist;
