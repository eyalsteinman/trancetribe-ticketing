import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface Production {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
}

interface ProductionCarouselProps {
  userId: string | null;
  onLoginRequired?: () => void;
}

const ProductionCarousel = ({ userId, onLoginRequired }: ProductionCarouselProps) => {
  const [productions, setProductions] = useState<Production[]>([]);
  const [followedProductions, setFollowedProductions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    loadProductions();
    if (userId) {
      loadFollowedProductions();
    }
  }, [userId]);

  const loadProductions = async () => {
    try {
      const { data, error } = await supabase
        .from('productions')
        .select('id, name, logo_url, description')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProductions(data || []);
    } catch (error) {
      console.error('Error loading productions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFollowedProductions = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('production_followers')
        .select('production_id')
        .eq('user_id', userId);

      if (error) throw error;
      setFollowedProductions(new Set(data?.map(f => f.production_id) || []));
    } catch (error) {
      console.error('Error loading followed productions:', error);
    }
  };

  const handleJoinTribe = async (productionId: string) => {
    if (!userId) {
      if (onLoginRequired) {
        onLoginRequired();
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('production_followers')
        .insert({ user_id: userId, production_id: productionId });

      if (error) throw error;

      setFollowedProductions(prev => new Set([...prev, productionId]));
      toast({
        title: t('success'),
        description: 'Successfully joined tribe!',
      });
    } catch (error: any) {
      console.error('Error joining tribe:', error);
      toast({
        title: t('error'),
        description: error.message || 'Failed to join tribe',
        variant: 'destructive',
      });
    }
  };

  const handleLeaveTribe = async (productionId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('production_followers')
        .delete()
        .eq('user_id', userId)
        .eq('production_id', productionId);

      if (error) throw error;

      setFollowedProductions(prev => {
        const newSet = new Set(prev);
        newSet.delete(productionId);
        return newSet;
      });

      toast({
        title: t('success'),
        description: 'Successfully left tribe',
      });
    } catch (error: any) {
      console.error('Error leaving tribe:', error);
      toast({
        title: t('error'),
        description: error.message || 'Failed to leave tribe',
        variant: 'destructive',
      });
    }
  };

  if (loading || productions.length === 0) {
    return null;
  }

  return (
    <div className="w-full mb-6">
      <h2 className="text-xl font-bold mb-4 text-foreground">{t('join_tribes')}</h2>
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {productions.map((production) => {
            const isFollowing = followedProductions.has(production.id);
            
            return (
              <CarouselItem key={production.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                <Card className="overflow-hidden border-border bg-card">
                  <div className="aspect-square relative">
                    {production.logo_url ? (
                      <img 
                        src={production.logo_url} 
                        alt={production.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="text-4xl font-bold text-primary/40">
                          {production.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-sm line-clamp-1">{production.name}</h3>
                    {production.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{production.description}</p>
                    )}
                    <Button
                      onClick={() => isFollowing ? handleLeaveTribe(production.id) : handleJoinTribe(production.id)}
                      className="w-full"
                      variant={isFollowing ? "outline" : "default"}
                      size="sm"
                    >
                      {isFollowing ? t('leave_tribe') : t('join_tribe')}
                    </Button>
                  </div>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="left-0" />
        <CarouselNext className="right-0" />
      </Carousel>
    </div>
  );
};

export default ProductionCarousel;
