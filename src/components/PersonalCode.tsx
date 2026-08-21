import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { Copy, IdCard } from 'lucide-react';
import AppLayout from '@/components/ui/app-layout';
import EmptyState from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

interface PersonalCodeProps {
  user: User;
  onBack: () => void;
}

const PersonalCode = ({ user, onBack }: PersonalCodeProps) => {
  const [personalCode, setPersonalCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPersonalCode();
  }, []);

  const loadPersonalCode = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('personal_code')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setPersonalCode(data?.personal_code || '');
    } catch (error) {
      console.error('Error loading personal code:', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(personalCode);
      toast({
        title: 'Copied!',
        description: 'Personal code copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy code',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout
      title="Personal Code"
      subtitle="Share this code with friends so they can add you"
      onBack={onBack}
      width="md"
    >
      {loading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : failed ? (
        <EmptyState
          variant="error"
          icon={<IdCard className="h-7 w-7" />}
          title="Could not load your code"
          description="Something went wrong while fetching your personal code."
          actionLabel="Try again"
          onAction={loadPersonalCode}
        />
      ) : !personalCode ? (
        <EmptyState
          icon={<IdCard className="h-7 w-7" />}
          title="No code yet"
          description="Your personal code is created with your profile. Complete your info and check back."
        />
      ) : (
        <Card className="transition-colors hover:bg-accent/10">
          <CardContent className="p-0">
            <button
              type="button"
              onClick={copyToClipboard}
              aria-label={`Copy personal code ${personalCode}`}
              className="flex w-full flex-col items-center gap-2 rounded-xl p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="text-3xl font-bold tracking-widest text-foreground">
                {personalCode}
              </span>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Copy className="h-4 w-4" aria-hidden="true" />
                Press the number to copy
              </span>
            </button>
          </CardContent>
        </Card>
      )}
    </AppLayout>
  );
};

export default PersonalCode;
