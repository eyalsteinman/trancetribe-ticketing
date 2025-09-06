import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import PartyPreview from "./PartyPreview";
import BrowseMenu from "./BrowseMenu";

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
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [browseMode, setBrowseMode] = useState("production");

  const filteredProductions = productions.filter(production =>
    production.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const handleProductionClick = (production: Production) => {
    setSelectedProduction(production);
  };

  const handlePartyClick = (party: Party) => {
    setSelectedParty(party);
  };


  if (selectedParty) {
    return (
      <div className="min-h-screen w-full p-4">
        <PartyPreview 
          party={selectedParty} 
          onBack={() => setSelectedParty(null)}
          onLoginRequired={onLoginPrompt}
        />
      </div>
    );
  }

  if (selectedProduction) {
    const productionParties = parties.filter(p => p.production_id === selectedProduction.id);
    return (
      <div className="min-h-screen w-full p-4">
        <div className="mb-6 text-center">
          {selectedProduction.logo_url ? (
            <img
              src={selectedProduction.logo_url}
              alt={selectedProduction.name}
              className="w-32 h-32 object-cover mx-auto mb-4"
            />
          ) : (
            <div className="w-32 h-32 bg-muted flex items-center justify-center mx-auto mb-4">
              <span className="font-semibold">{selectedProduction.name}</span>
            </div>
          )}
          <h2 className="text-2xl font-bold">{selectedProduction.name}</h2>
        </div>
        
        <div className="flex overflow-x-auto gap-4 pb-4">
          {productionParties.map((party) => (
            <div
              key={party.id}
              onClick={() => handlePartyClick(party)}
              className="flex-shrink-0 cursor-pointer w-64"
            >
              {party.photo_url ? (
                <img
                  src={party.photo_url}
                  alt={party.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-muted flex items-center justify-center">
                  <span className="text-center p-4">{party.name}</span>
                </div>
              )}
              <div className="p-2">
                <h3 className="font-semibold">{party.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(party.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <button
          onClick={() => setSelectedProduction(null)}
          className="mt-4 px-4 py-2 bg-primary text-white rounded"
        >
          Back
        </button>
      </div>
    );
  }

  const getDisplayItems = () => {
    if (browseMode === "production") {
      return searchQuery ? filteredProductions : productions;
    } else if (browseMode === "party") {
      return parties.filter(party => 
        !searchQuery || party.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else { // date
      return parties
        .filter(party => 
          !searchQuery || party.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
  };

  const displayItems = getDisplayItems();

  return (
    <div className="w-full p-4">
      <BrowseMenu value={browseMode} onValueChange={setBrowseMode} />
      
      <div className="flex overflow-x-auto gap-4 pb-4 mb-6">
        {browseMode === "production" ? (
          productions.map((production) => (
            <div
              key={production.id}
              onClick={() => handleProductionClick(production)}
              className="flex-shrink-0 cursor-pointer w-24"
            >
              {production.logo_url ? (
                <img
                  src={production.logo_url}
                  alt={production.name}
                  className="w-24 h-24 object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-muted flex items-center justify-center">
                  <span className="text-xs text-center font-semibold">{production.name}</span>
                </div>
              )}
              <p className="text-xs text-center mt-2 truncate">{production.name}</p>
            </div>
          ))
        ) : (
          parties.map((party) => (
            <div
              key={party.id}
              onClick={() => handlePartyClick(party)}
              className="flex-shrink-0 cursor-pointer w-32"
            >
              {party.photo_url ? (
                <img
                  src={party.photo_url}
                  alt={party.name}
                  className="w-32 h-24 object-cover"
                />
              ) : (
                <div className="w-32 h-24 bg-muted flex items-center justify-center">
                  <span className="text-xs text-center p-2">{party.name}</span>
                </div>
              )}
              <p className="text-xs text-center mt-2 truncate">{party.name}</p>
            </div>
          ))
        )}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input
          type="text"
          placeholder="Search events by name or production"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 py-6 text-lg bg-background/50 border-muted focus:bg-background"
        />
      </div>

      {browseMode === "party" && (
        <div className="space-y-4">
          {(displayItems as Party[]).map((party) => (
            <div
              key={party.id}
              onClick={() => handlePartyClick(party)}
              className="cursor-pointer w-full"
            >
              {party.photo_url ? (
                <img
                  src={party.photo_url}
                  alt={party.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-muted flex items-center justify-center">
                  <span className="text-center p-4">{party.name}</span>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold">{party.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(party.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductionBrowser;