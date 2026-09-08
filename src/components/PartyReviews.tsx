import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Star } from 'lucide-react';

interface PartyReviewsProps {
  partyId: string;
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

const Stars = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => (
  <div className="flex items-center gap-1" role={onChange ? 'radiogroup' : undefined} aria-label="Rating">
    {[1, 2, 3, 4, 5].map((n) => {
      const filled = n <= value;
      const Icon = (
        <Star
          className={`h-5 w-5 ${filled ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
          aria-hidden="true"
        />
      );
      return onChange ? (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          aria-checked={value === n}
          role="radio"
          className="rounded-md p-0.5"
        >
          {Icon}
        </button>
      ) : (
        <span key={n}>{Icon}</span>
      );
    })}
  </div>
);

const PartyReviews = ({ partyId }: PartyReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const { data, error } = await supabase
        .from('party_reviews')
        .select('id, user_id, rating, comment, created_at')
        .eq('party_id', partyId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const rows = (data || []) as Review[];
      setReviews(rows);

      const mine = rows.find((r) => r.user_id === user?.id);
      if (mine) {
        setRating(mine.rating);
        setComment(mine.comment || '');
      }

      const ids = [...new Set(rows.map((r) => r.user_id))];
      if (ids.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, nickname')
          .in('user_id', ids);
        const map: Record<string, string> = {};
        (profiles || []).forEach((p: any) => {
          map[p.user_id] = p.nickname || p.display_name || 'Guest';
        });
        setNames(map);
      }
    } catch (error: any) {
      console.error('Failed to load reviews', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partyId]);

  const submit = async () => {
    if (rating < 1) {
      toast({ title: 'Pick a rating', description: 'Choose 1 to 5 stars.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in first');

      const { error } = await supabase
        .from('party_reviews')
        .upsert(
          { party_id: partyId, user_id: user.id, rating, comment: comment.trim() || null },
          { onConflict: 'party_id,user_id' }
        );
      if (error) throw error;

      toast({ title: 'Thanks for your review!' });
      await load();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const average = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Ratings &amp; Reviews</span>
          {average && (
            <span className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
              <Star className="h-4 w-4 fill-primary text-primary" aria-hidden="true" />
              {average} ({reviews.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3 rounded-lg border p-3">
          <p className="text-sm font-medium">{reviews.some((r) => r.user_id === userId) ? 'Edit your review' : 'Leave a review'}</p>
          <Stars value={rating} onChange={setRating} />
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How was the event?"
            rows={3}
            aria-label="Review comment"
          />
          <Button className="w-full" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : 'Save review'}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading reviews…
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet — be the first.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{names[r.user_id] || 'Guest'}</span>
                  <Stars value={r.rating} />
                </div>
                {r.comment && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.comment}</p>}
                <p className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString('en-GB')}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PartyReviews;
