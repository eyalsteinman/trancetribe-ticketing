import { useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import BuyTicket from "@/components/BuyTicket";

interface VIPProductionProps {
  user: User;
  production: {
    id: string;
    name: string;
    logo_url: string | null;
    vip_description: string | null;
    vip_price: number | null;
    created_by: string;
  };
  onBack: () => void;
}

const VIPProduction = ({ production, onBack }: VIPProductionProps) => {
  useEffect(() => {
    document.title = `VIP | ${production.name}`;
  }, [production.name]);

  return (
    <div className="min-h-screen p-4">
      <header className="relative text-left mb-4">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back" className="absolute top-4 right-4 z-[9999] on-color back-button">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">{production.name}</h1>
      </header>

      <main className="max-w-md mx-auto space-y-6 text-left">
        <div className="flex justify-center">
          <img
            src={production.logo_url || "/placeholder.svg"}
            alt={`${production.name} logo`}
            className="h-24 w-24 object-contain"
            loading="lazy"
          />
        </div>

        <h2 className="text-center text-lg font-semibold">Purchase VIP</h2>
        <p className="text-center text-sm text-muted-foreground">
          Price: {production.vip_price ? `₪${production.vip_price}` : 'To be decided'}
        </p>

        {production.vip_price && (
          <BuyTicket
            ticketAmount={production.vip_price}
            currency="ILS"
            adminId={production.created_by}
            className="w-full"
          />
        )}

        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground text-center">
            {production.vip_description || "Details and benefits will appear here once configured by admin."}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default VIPProduction;
