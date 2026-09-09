import { useState } from 'react';
import BuyTicket from './BuyTicket';
import PromoCodeField, { AppliedPromo, applyPromo } from './PromoCodeField';

interface BuyTicketWithPromoProps {
  ticketAmount: number;
  currency?: string;
  adminId?: string;
  partyId?: string;
  productionId?: string | null;
  ticketTypeId?: string;
  className?: string;
  onPaymentSuccess?: () => void;
}

/** Ticket purchase with an optional promo code applied to the price. */
const BuyTicketWithPromo = ({
  ticketAmount,
  currency = 'ILS',
  adminId,
  partyId,
  productionId,
  ticketTypeId,
  className,
  onPaymentSuccess,
}: BuyTicketWithPromoProps) => {
  const [promo, setPromo] = useState<AppliedPromo | null>(null);
  const finalPrice = applyPromo(ticketAmount, promo);

  return (
    <div className={`space-y-3 ${className || ''}`}>
      <PromoCodeField
        partyId={partyId}
        productionId={productionId}
        basePrice={ticketAmount}
        onChange={(next) => setPromo(next)}
      />
      {promo && (
        <p className="text-xs text-muted-foreground">
          Original price <span className="line-through">{ticketAmount} {currency}</span> — you pay {finalPrice} {currency}
        </p>
      )}
      <BuyTicket
        ticketAmount={finalPrice}
        currency={currency}
        adminId={adminId}
        partyId={partyId}
        ticketTypeId={ticketTypeId}
        className="w-full"
        onPaymentSuccess={onPaymentSuccess}
      />
    </div>
  );
};

export default BuyTicketWithPromo;
