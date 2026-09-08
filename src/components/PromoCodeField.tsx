import { useState } from 'react';
import { Button } from '@/components/ui/button';
import RtlInput from '@/components/RtlInput';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TicketPercent, X } from 'lucide-react';

export interface AppliedPromo {
  id: string;
  code: string;
  discountPercent: number | null;
  discountAmount: number | null;
}

interface PromoCodeFieldProps {
  partyId?: string;
  productionId?: string | null;
  basePrice: number;
  onChange?: (promo: AppliedPromo | null, finalPrice: number) => void;
}

export const applyPromo = (basePrice: number, promo: AppliedPromo | null) => {
  if (!promo) return basePrice;
  let price = basePrice;
  if (promo.discountPercent) price = price - (price * promo.discountPercent) / 100;
  if (promo.discountAmount) price = price - promo.discountAmount;
  return Math.max(0, Math.round(price * 100) / 100);
};

const PromoCodeField = ({ partyId, productionId, basePrice, onChange }: PromoCodeFieldProps) => {
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState<AppliedPromo | null>(null);
  const [checking, setChecking] = useState(false);
  const { toast } = useToast();

  const check = async () => {
    const value = code.trim();
    if (!value) return;
    setChecking(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('id, code, party_id, production_id, discount_percent, discount_amount, max_uses, used_count, is_active, expires_at')
        .ilike('code', value)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) throw new Error('This code is not valid');
      if (data.expires_at && new Date(data.expires_at) < new Date()) throw new Error('This code has expired');
      if (data.max_uses !== null && data.used_count >= data.max_uses) throw new Error('This code has been fully used');
      if (data.party_id && partyId && data.party_id !== partyId) throw new Error('This code is not valid for this event');
      if (!data.party_id && data.production_id && productionId && data.production_id !== productionId) {
        throw new Error('This code is not valid for this event');
      }

      const promo: AppliedPromo = {
        id: data.id,
        code: data.code,
        discountPercent: data.discount_percent,
        discountAmount: data.discount_amount,
      };
      setApplied(promo);
      onChange?.(promo, applyPromo(basePrice, promo));
      toast({ title: 'Code applied', description: `New price: ${applyPromo(basePrice, promo)} ILS` });
    } catch (error: any) {
      setApplied(null);
      onChange?.(null, basePrice);
      toast({ title: 'Invalid code', description: error.message, variant: 'destructive' });
    } finally {
      setChecking(false);
    }
  };

  const clear = () => {
    setApplied(null);
    setCode('');
    onChange?.(null, basePrice);
  };

  return (
    <div className="space-y-2">
      {applied ? (
        <div className="flex items-center justify-between rounded-lg border p-2">
          <Badge className="flex items-center gap-1">
            <TicketPercent className="h-3 w-3" aria-hidden="true" />
            {applied.code.toUpperCase()}
          </Badge>
          <span className="text-sm font-medium">{applyPromo(basePrice, applied)} ILS</span>
          <Button variant="ghost" size="sm" onClick={clear} aria-label="Remove promo code">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <RtlInput
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Promo code"
            aria-label="Promo code"
          />
          <Button variant="outline" onClick={check} disabled={checking || !code.trim()}>
            {checking ? 'Checking…' : 'Apply'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PromoCodeField;
