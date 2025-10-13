import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import Footer from '@/components/ui/footer';
import { useBackground } from '@/contexts/BackgroundContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import { supabase } from '@/integrations/supabase/client';
import BuyTicket from '@/components/BuyTicket';

interface InsuranceProps {
  onBack: () => void;
}

interface Production {
  id: string;
  name: string;
  created_by: string;
  insurance_description: string | null;
  insurance_price: number | null;
  insurance_enabled: boolean;
}

const Insurance = ({ onBack }: InsuranceProps) => {
  const { backgroundColor, isBackgroundDark } = useBackground();
  const { t } = useLanguage();
  const [productions, setProductions] = useState<Production[]>([]);
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProductions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('productions')
        .select('id, name, created_by, insurance_description, insurance_price, insurance_enabled')
        .order('name');
      
      if (data) {
        setProductions(data);
      }
      setLoading(false);
    };
    
    loadProductions();
  }, []);
  
  useBackNavigation({
    onBackNavigation: onBack,
    isActive: true
  });

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#4C1D95]">
      {/* Animated background */}
      <div className="auth-animated-bg" />
      
      <div className="min-h-screen w-full relative z-10 p-4">
        <PageHeader
          title={t('insurance')}
          onBack={onBack}
        />
        
        <div className="max-w-md mx-auto pt-20 space-y-6 text-left">
        <Card>
          <CardHeader>
            <CardTitle>Select Production</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading productions...</p>
            ) : (
              <Select onValueChange={(value) => {
                const production = productions.find(p => p.id === value);
                setSelectedProduction(production || null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a production to see insurance options" />
                </SelectTrigger>
                <SelectContent>
                  {productions.map((production) => (
                    <SelectItem key={production.id} value={production.id}>
                      {production.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {selectedProduction && (
          <Card>
            <CardHeader>
              <CardTitle>Insurance for {selectedProduction.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedProduction.insurance_enabled ? (
                <p className="text-sm text-muted-foreground">
                  This production does not offer any kind of insurance.
                </p>
              ) : selectedProduction.insurance_description && selectedProduction.insurance_price ? (
                <>
                  <div>
                    <h4 className="font-medium mb-2">Insurance Coverage</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedProduction.insurance_description}
                    </p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <p className="text-lg font-semibold mb-4">
                      Price: ₪{selectedProduction.insurance_price}
                    </p>
                    
                    <BuyTicket
                      ticketAmount={selectedProduction.insurance_price}
                      currency="ILS"
                      adminId={selectedProduction.created_by}
                      className="w-full"
                    />
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {t('for_terms')}
                    {' '}
                    <a className="underline underline-offset-4" href="/insurance-terms.pdf" download>
                      {t('press_here')}
                    </a>
                    .
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This production does not offer any kind of insurance.
                </p>
              )}
            </CardContent>
          </Card>
        )}

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Insurance;
