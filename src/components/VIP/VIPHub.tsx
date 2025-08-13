import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VIPHubProps {
  user: User;
  nickname?: string;
  onBack: () => void;
  onSelectProduction: (production: { id: string; name: string; logo_url: string | null; vip_description: string | null }) => void;
}

interface Production {
  id: string;
  name: string;
  logo_url: string | null;
  vip_description: string | null;
}

const VIPHub = ({ user, nickname, onBack, onSelectProduction }: VIPHubProps) => {
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "VIP Section | User";
    loadProductions();
  }, []);

  const loadProductions = async () => {
    try {
      const { data, error } = await supabase
        .from('productions')
        .select('id, name, logo_url, vip_description')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading productions:', error);
      } else {
        setProductions(data || []);
      }
    } catch (error) {
      console.error('Error loading productions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <header className="relative text-left mb-4">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back" className="absolute top-4 right-4 z-[9999] on-color back-button">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">
          Become a VIP
        </h1>
      </header>

      <section className="space-y-4">
        {loading ? (
          <div className="text-center py-4">Loading productions...</div>
        ) : productions.length > 0 ? (
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Select a production</label>
            <Select onValueChange={(val) => {
              const production = productions.find(p => p.id === val);
              if (production) onSelectProduction(production);
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose production" />
              </SelectTrigger>
              <SelectContent className="pointer-events-auto">
                {productions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">No productions available</div>
        )}

        {!loading && productions.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Or tap a production below</p>
            <div className="grid grid-cols-2 gap-3">
              {productions.map((p) => (
                <Card
                  key={p.id}
                  className="aspect-square cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => onSelectProduction(p)}
                  role="button"
                  aria-label={`Open ${p.name}`}
                >
                  <CardHeader className="h-full flex flex-col items-center justify-center">
                    {p.logo_url && (
                      <img
                        src={p.logo_url}
                        alt={`${p.name} logo`}
                        className="h-12 w-12 object-contain mb-2"
                      />
                    )}
                    <CardTitle className="text-center text-sm">{p.name}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default VIPHub;