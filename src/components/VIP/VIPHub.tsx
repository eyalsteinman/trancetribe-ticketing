import { useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";

interface VIPHubProps {
  user: User;
  nickname?: string;
  onBack: () => void;
  onSelectProduction: (id: number) => void;
}

const VIPHub = ({ user, nickname, onBack, onSelectProduction }: VIPHubProps) => {
  useEffect(() => {
    document.title = "VIP Section | User";
  }, []);

  const displayName = nickname || user.user_metadata?.display_name || user.email || "User";
  const productions = Array.from({ length: 8 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen p-4">
      <header className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back" className="on-color back-button">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">
          {displayName}, welcome to VIP section
        </h1>
      </header>

      <section className="space-y-4">
        <div>
          <label className="block text-sm text-muted-foreground mb-2">Select a production</label>
          <Select onValueChange={(val) => onSelectProduction(parseInt(val, 10))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose production" />
            </SelectTrigger>
            <SelectContent className="pointer-events-auto">
              {productions.map((p) => (
                <SelectItem key={p} value={String(p)}>
                  Production {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">Or tap a production below</p>
          <div className="grid grid-cols-2 gap-3">
            {productions.map((p) => (
              <Card
                key={p}
                className="aspect-square cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => onSelectProduction(p)}
                role="button"
                aria-label={`Open Production ${p}`}
              >
                <CardHeader className="h-full flex items-center justify-center">
                  <CardTitle>Production {p}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default VIPHub;
