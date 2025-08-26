import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import QRScanner from './QRScanner';
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
        title: "Error",
        description: "Please enter a valid amount first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Find the user bar tab by barcode
      const { data: barTabData, error: barTabError } = await supabase
        .from('user_bar_tabs')
        .select('*')
        .eq('barcode', qrCode)
        .eq('status', 'active')
        .single();

      if (barTabError || !barTabData) {
        toast({
          title: "Error",
          description: "Invalid or inactive bar tab QR code",
          variant: "destructive"
        });
        return;
      }

      const deductAmount = parseFloat(amount);
      
      if (barTabData.remaining_amount < deductAmount) {
        toast({
          title: "Error",
          description: "Insufficient funds on bar tab",
          variant: "destructive"
        });
        return;
      }

      // Update the remaining amount
      const newRemainingAmount = barTabData.remaining_amount - deductAmount;
      const { error: updateError } = await supabase
        .from('user_bar_tabs')
        .update({ 
          remaining_amount: newRemainingAmount,
          status: newRemainingAmount <= 0 ? 'depleted' : 'active'
        })
        .eq('id', barTabData.id);

      if (updateError) {
        toast({
          title: "Error",
          description: "Failed to update bar tab",
          variant: "destructive"
        });
        return;
      }

      // Record the transaction
      await supabase
        .from('bar_tab_transactions')
        .insert({
          user_bar_tab_id: barTabData.id,
          bar_tab_id: barTabData.production_id, // Using production_id as reference
          quantity: 1,
          amount_spent: deductAmount,
          created_by: user.id,
          transaction_type: 'purchase'
        });

      toast({
        title: "Success",
        description: `${deductAmount} ILS deducted. Remaining: ${newRemainingAmount} ILS`,
      });

      setAmount('');
      setShowScanner(false);
    } catch (error) {
      console.error('Error processing bar tab scan:', error);
      toast({
        title: "Error",
        description: "Failed to process transaction",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Bar Tab Scanner</h1>
          <div></div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enter Amount to Deduct</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Amount (ILS)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount..."
                className="mt-1"
              />
            </div>

            <Button
              onClick={() => setShowScanner(true)}
              disabled={!amount || parseFloat(amount) <= 0 || loading}
              className="w-full"
            >
              {loading ? "Processing..." : "Start QR Scanner"}
            </Button>
          </CardContent>
        </Card>

        {showScanner && (
          <Card>
            <CardHeader>
              <CardTitle>Scan Bar Tab QR Code</CardTitle>
            </CardHeader>
            <CardContent>
              <QRScanner
                onScan={handleScan}
                onClose={() => setShowScanner(false)}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BarTabScanner;