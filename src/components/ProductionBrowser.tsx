import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import PartyPreview from "./PartyPreview";

interface Production {
  id: string;
  name: string;
  logo_url: string | null;
}

interface Party {
  id: string;
  name: string;
  date: string;
  photo_url: string | null;
  description: string | null;
  price: number | null;
  is_free: boolean;
  production_id: string | null;
  start_time?: string | null;
  end_time?: string | null;
  productions?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
}

interface ProductionBrowserProps {
  onLoginPrompt: () => void;
}

const ProductionBrowser = ({ onLoginPrompt }: ProductionBrowserProps) => {
  const [productions, setProductions] = useState<Production[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);

  useEffect(() => {
    loadProductions();
    loadParties();
  }, []);

  const loadProductions = async () => {
    const { data, error } = await supabase
      .from("productions")
      .select("id, name, logo_url")
      .order('name');
    
    if (!error && data) {
      setProductions(data);
    }
  };

  const loadParties = async () => {
    const { data, error } = await supabase
      .from("parties")
      .select(`
        *,
        productions (
          id,
          name,
          logo_url
        )
      `)
      .order('date', { ascending: true });
    
    if (!error && data) {
      setParties(data);
    }
  };

  const handleProductionClick = (productionId: string) => {
    const productionParties = parties.filter(p => p.production_id === productionId);
    if (productionParties.length > 0) {
      setSelectedParty(productionParties[0]);
    }
  };


  if (selectedParty) {
    return (
      <PartyPreview 
        party={selectedParty} 
        onBack={() => setSelectedParty(null)}
        onLoginRequired={onLoginPrompt}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-foreground">Browse by Production</h2>
      
      {productions.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {productions.map((production) => (
            <Card
              key={production.id}
              onClick={() => handleProductionClick(production.id)}
              className="cursor-pointer group border-0 bg-gradient-to-r from-card to-card/80 hover-lift"
            >
              <CardContent className="p-4">
                <div className="aspect-square rounded-lg overflow-hidden mb-3">
                  {production.logo_url ? (
                    <img
                      src={production.logo_url}
                      alt={production.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <span className="text-sm text-center px-2 font-semibold">{production.name}</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-center font-medium text-foreground truncate">{production.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center">No productions available</p>
      )}
    </div>
  );
};

export default ProductionBrowser;