import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import QRScanner from './QRScanner';
import AppLayout from '@/components/ui/app-layout';
import { User } from '@supabase/supabase-js';

interface BarTabScannerProps {
  user: User;
  onBack: () => void;
}

const BarTabScanner = ({ user, onBack }: BarTabScannerProps) => {
  const [amount, setAmount] = useState<string>('');
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleScan = async (qrCode: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Enter an amount first',
        description: 'Type the amount to deduct before scanning.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: barTabData, error: barTabError } = await supabase
        .from('user_bar_tabs')
        .select('*')
        .eq('barcode', qrCode)
        .eq('status', 'active')
        .single();

      if (barTabError || !barTabData) {
        toast({
          title: 'Bar tab not recognised',
          description: 'This QR code is invalid or the bar tab is no longer active.',
          variant: 'destructive',
        });
        return;
      }

      const deductAmount = parseFloat(amount);

      if (barTabData.remaining_amount < deductAmount) {
        toast({
          title: 'Insufficient funds',
          description: `Only ₪${barTabData.remaining_amount} left on this bar tab.`,
          variant: 'destructive',
        });
        return;
      }

      const newRemainingAmount = barTabData.remaining_amount - deductAmount;
      const { error: updateError } = await supabase
        .from('user_bar_tabs')
        .update({
          remaining_amount: newRemainingAmount,
          status: newRemainingAmount <= 0 ? 'depleted' : 'active',
        })
        .eq('id', barTabData.id);

      if (updateError) {
        toast({
          title: 'Update failed',
          description: 'We could not update the bar tab. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      await supabase.from('bar_tab_transactions').insert({
        user_bar_tab_id: barTabData.id,
        bar_tab_id: barTabData.production_id,
        quantity: 1,
        amount_spent: deductAmount,
        created_by: user.id,
        transaction_type: 'purchase',
      });

      toast({
        title: 'Charged successfully',
        description: `₪${deductAmount} deducted. Remaining: ₪${newRemainingAmount}`,
      });

      setAmount('');
      setShowScanner(false);
    } catch (error) {
      console.error('Error processing bar tab scan:', error);
      toast({
        title: 'Something went wrong',
        description: 'The transaction could not be processed.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout
      title="Bar Tab Scanner"
      subtitle="Charge a guest's bar tab by scanning their QR code"
      onBack={onBack}
      width="md"
    >
      <Card>
        <CardHeader>
          <CardTitle>Amount to deduct</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bar-tab-amount">Amount (ILS)</Label>
            <Input
              id="bar-tab-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount…"
            />
          </div>

          <Button
            onClick={() => setShowScanner(true)}
            disabled={!amount || parseFloat(amount) <= 0 || loading}
            className="min-h-11 w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Processing…
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4" aria-hidden="true" />
                Start QR scanner
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Tip: enter the amount first, then scan. The guest's remaining balance is shown right
            after the charge.
          </p>
        </CardContent>
      </Card>

      {showScanner && (
        <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}
    </AppLayout>
  );
};

export default BarTabScanner;
