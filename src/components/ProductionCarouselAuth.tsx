import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface Production {
  id: string;
  name: string;
  logo_url: string | null;
}

const ProductionCarouselAuth = () => {
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    loadProductions();
  }, []);

  const loadProductions = async () => {
    try {
      const { data, error } = await supabase
        .from('productions')
        .select('id, name, logo_url')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProductions(data || []);
    } catch (error) {
      console.error('Error loading productions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || productions.length === 0) {
    return null;
  }

  return (
    <div className="w-full mb-6">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {productions.map((production) => (
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
                <div className="p-4 flex flex-col items-center space-y-2">
                  <h3 className="font-semibold text-center">{production.name}</h3>
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    size="sm"
                    onClick={() => {
                      // Scroll to auth form
                      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    }}
                  >
                    {t('login_to_join_tribe')}
                  </Button>
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default ProductionCarouselAuth;
