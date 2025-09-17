import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';
import { Loader2, CreditCard } from 'lucide-react';

interface BuyTicketProps {
  ticketAmount: number;
  currency?: string;
  adminId?: string;
  partyId?: string;
  ticketTypeId?: string;
  className?: string;
  onPaymentSuccess?: () => void;
}

interface PayPalWindow extends Window {
  paypal?: {
    Buttons: (config: any) => {
      render: (container: string) => void;
    };
  };
}

declare const window: PayPalWindow;

const BuyTicket: React.FC<BuyTicketProps> = ({
  ticketAmount,
  currency = 'ILS',
  adminId,
  partyId,
  ticketTypeId,
  className = '',
  onPaymentSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);
  const [showPayPalButtons, setShowPayPalButtons] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];

  const handleBuyTicket = async () => {
    if (!adminId) {
      toast({
        title: t.error,
        description: 'Admin ID is required for payment processing',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Creating PayPal order...', { ticketAmount, currency, adminId, partyId, ticketTypeId });
      
      // Call the PayPal checkout edge function
      const { data, error } = await supabase.functions.invoke('paypal-checkout', {
        body: {
          amount: ticketAmount,
          currency: currency,
          adminId: adminId,
          partyId: partyId,
          ticketTypeId: ticketTypeId
        }
      });

      if (error) {
        console.error('PayPal checkout error:', error);
        throw new Error(error.message || 'Failed to create PayPal order');
      }

      if (!data?.orderId) {
        throw new Error('No order ID returned from PayPal');
      }

      console.log('PayPal order created:', data);
      setPaypalOrderId(data.orderId);
      
      // Load PayPal SDK if not already loaded
      if (!window.paypal) {
        await loadPayPalSDK();
      }
      
      // Show PayPal buttons
      setShowPayPalButtons(true);
      
      toast({
        title: t.success || 'Success',
        description: 'PayPal order created. Please complete the payment.',
      });

    } catch (error: any) {
      console.error('Error creating PayPal order:', error);
      toast({
        title: t.error,
        description: error.message || 'Failed to create payment order',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPayPalSDK = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.paypal) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.REACT_APP_PAYPAL_CLIENT_ID || 'test'}&currency=${currency}`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
      document.head.appendChild(script);
    });
  };

  const renderPayPalButtons = () => {
    if (!showPayPalButtons || !paypalOrderId || !window.paypal) {
      return null;
    }

    // Create PayPal buttons
    setTimeout(() => {
      if (window.paypal && document.getElementById('paypal-button-container')) {
        window.paypal.Buttons({
          createOrder: () => paypalOrderId,
          onApprove: async (data: any) => {
            console.log('Payment approved:', data);
            toast({
              title: t.success || 'Success',
              description: 'Payment completed successfully!',
            });
            
            // Call the success callback if provided
            if (onPaymentSuccess) {
              onPaymentSuccess();
            }
            
            setShowPayPalButtons(false);
            setPaypalOrderId(null);
          },
          onError: (err: any) => {
            console.error('PayPal error:', err);
            toast({
              title: t.error,
              description: 'Payment failed. Please try again.',
              variant: 'destructive',
            });
            setShowPayPalButtons(false);
            setPaypalOrderId(null);
          },
          onCancel: () => {
            console.log('Payment cancelled');
            toast({
              title: 'Payment Cancelled',
              description: 'You cancelled the payment.',
            });
            setShowPayPalButtons(false);
            setPaypalOrderId(null);
          }
        }).render('#paypal-button-container');
      }
    }, 100);

    return (
      <div className="mt-4 p-4 bg-background/50 backdrop-blur-sm rounded-lg border">
        <p className="text-sm text-foreground/80 mb-3 text-center">
          Complete your payment with PayPal or credit/debit card
        </p>
        <div id="paypal-button-container"></div>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Button
        onClick={handleBuyTicket}
        disabled={isLoading || showPayPalButtons}
        variant="default"
        size="lg"
        className="w-full text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t.loading || 'Loading...'}
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            {t.buy_ticket || 'Buy Ticket'} - {ticketAmount} {currency}
          </>
        )}
      </Button>

      {renderPayPalButtons()}

      {showPayPalButtons && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowPayPalButtons(false);
              setPaypalOrderId(null);
            }}
            className="text-foreground/60 hover:text-foreground"
          >
            Cancel Payment
          </Button>
        </div>
      )}
    </div>
  );
};

export default BuyTicket;