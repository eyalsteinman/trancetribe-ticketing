import { useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface VIPProductionProps {
  user: User;
  productionId: number;
  onBack: () => void;
}

const VIPProduction = ({ productionId, onBack }: VIPProductionProps) => {
  useEffect(() => {
    document.title = `VIP | Production ${productionId}`;
  }, [productionId]);

  return (
    <div className="min-h-screen p-4">
      <header className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">Production {productionId}</h1>
      </header>

      <main className="max-w-md mx-auto space-y-6">
        <div className="flex justify-center">
          <img
            src="/placeholder.svg"
            alt={`Production ${productionId} logo placeholder`}
            className="h-24 w-24 object-contain"
            loading="lazy"
          />
        </div>

        <h2 className="text-center text-lg font-semibold">Purchase VIP</h2>
        <p className="text-center text-sm text-muted-foreground">Price: To be decided</p>

        <Button size="lg" className="w-full" aria-label="Buy VIP">
          BUY
        </Button>

        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground text-center">
            Details and benefits will appear here once configured by admin.
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default VIPProduction;
