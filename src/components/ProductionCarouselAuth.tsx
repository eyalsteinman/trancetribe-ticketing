import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import BrowseMenu from '@/components/BrowseMenu';

interface Production {
  id: string;
  name: string;
  logo_url: string | null;
}

interface Party {
  id: string;
  name: string;
  photo_url: string | null;
  date: string;
}

const ProductionCarouselAuth = () => {
  const [productions, setProductions] = useState<Production[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [browseMode, setBrowseMode] = useState<string>('party');
  const { t } = useLanguage();

  useEffect(() => {
    if (browseMode === 'production') {
      loadProductions();
    } else if (browseMode === 'party') {
      loadParties();
    }
  }, [browseMode]);

  const loadProductions = async () => {
    setLoading(true);
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

  const loadParties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('parties')
        .select('id, name, photo_url, date')
        .eq('is_active', true)
        .order('date', { ascending: true });

      if (error) throw error;
      setParties(data || []);
    } catch (error) {
      console.error('Error loading parties:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || (browseMode === 'production' && productions.length === 0) || (browseMode === 'party' && parties.length === 0)) {
    return (
      <div className="w-full mb-6">
        <BrowseMenu value={browseMode} onValueChange={setBrowseMode} />
      </div>
    );
  }

  const items = browseMode === 'production' ? productions : parties;
  const buttonText = browseMode === 'production' ? t('login_to_join_tribe') : 'Login to Purchase Tickets';

  const handleScrollToAuth = () => {
    const authSection = document.querySelector('[data-auth-form]');
    if (authSection) {
      authSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="w-full mb-6">
      <BrowseMenu value={browseMode} onValueChange={setBrowseMode} />
      <div className="animate-fade-in">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {items.map((item) => (
              <CarouselItem key={item.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                <Card className="overflow-hidden border-border bg-card">
                  {'logo_url' in item ? (
                    // Production: Half height container with logo at half size
                    <div className="aspect-[4/3] relative bg-muted flex items-center justify-center">
                      {item.logo_url ? (
                        <img 
                          src={item.logo_url} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <span className="text-4xl font-bold text-primary/40">
                            {item.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Party: Full height container, show full photo
                    <div className="relative bg-muted">
                      {item.photo_url ? (
                        <img 
                          src={item.photo_url} 
                          alt={item.name}
                          className="w-full h-auto object-cover"
                        />
                      ) : (
                        <div className="aspect-[2/3] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <span className="text-4xl font-bold text-primary/40">
                            {item.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-4 flex flex-col items-center space-y-2">
                    <h3 className="font-semibold text-center">{item.name}</h3>
                    <Button
                      className="w-full bg-primary hover:bg-primary text-foreground"
                      size="sm"
                      onClick={handleScrollToAuth}
                    >
                      {buttonText}
                    </Button>
                  </div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
};

export default ProductionCarouselAuth;
