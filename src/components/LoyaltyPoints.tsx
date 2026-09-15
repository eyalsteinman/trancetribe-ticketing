import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from './ui/page-header';
import Footer from '@/components/ui/footer';
import EmptyState from '@/components/ui/empty-state';
import { Sparkles, Trophy } from 'lucide-react';

interface LoyaltyPointsProps {
  userId: string;
  onBack: () => void;
}

interface PointsRow {
  id: string;
  points: number;
  reason: string;
  created_at: string;
  party_id: string | null;
  parties?: { name: string } | null;
}

export const TRIBE_LEVELS = [
  { name: 'Seeker', min: 0 },
  { name: 'Dancer', min: 300 },
  { name: 'Voyager', min: 800 },
  { name: 'Shaman', min: 1500 },
  { name: 'Legend', min: 3000 },
];

export const getLevel = (total: number) => {
  let index = 0;
  TRIBE_LEVELS.forEach((lvl, i) => {
    if (total >= lvl.min) index = i;
  });
  const current = TRIBE_LEVELS[index];
  const next = TRIBE_LEVELS[index + 1];
  const progress = next
    ? Math.min(100, Math.round(((total - current.min) / (next.min - current.min)) * 100))
    : 100;
  return { current, next, progress, index };
};

const LoyaltyPoints = ({ userId, onBack }: LoyaltyPointsProps) => {
  const [rows, setRows] = useState<PointsRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('loyalty_points')
        .select('id, points, reason, created_at, party_id, parties(name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setRows((data as unknown as PointsRow[]) || []);
      setLoading(false);
    };
    load();
  }, [userId]);

  const total = rows.reduce((sum, r) => sum + (r.points || 0), 0);
  const { current, next, progress } = getLevel(total);

  return (
    <div className="min-h-dvh bg-background">
      <div className="auth-animated-bg" aria-hidden="true" />
      <main className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-10">
        <PageHeader title="Tribe Level" subtitle="Points you earn every time you attend" onBack={onBack} />

        <Card className="glass-card mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Trophy className="h-5 w-5 text-primary" aria-hidden="true" />
              {current.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <p className="text-3xl font-display tracking-wide text-foreground">
                  {total} <span className="text-base text-muted-foreground">points</span>
                </p>
                <Progress value={progress} aria-label="Progress to next level" />
                <p className="text-xs text-muted-foreground">
                  {next
                    ? `${next.min - total} points to reach ${next.name}`
                    : 'Top level reached — you are a Legend.'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="h-10 w-10" />}
                title="No points yet"
                description="Attend an event and get your ticket scanned at the door to earn your first 100 points."
              />
            ) : (
              <ul className="divide-y divide-border/60">
                {rows.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">
                        {r.parties?.name || (r.reason === 'attendance' ? 'Event attendance' : r.reason)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">+{r.points}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default LoyaltyPoints;
