import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import PartyPreview from "./PartyPreview";
import BrowseMenu from "./BrowseMenu";
import { useBackground } from "@/contexts/BackgroundContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface Production {
  id: string;
  name: string;
  logo_url: string | null;
  description?: string | null;
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
  carouselOnly?: boolean;
}

const ProductionBrowser = ({ onLoginPrompt, carouselOnly = false }: ProductionBrowserProps) => {
  const { t } = useLanguage();
  const [productions, setProductions] = useState<Production[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [browseMode, setBrowseMode] = useState("production");
  const { isBackgroundDark } = useBackground();

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
      .select("id, name, logo_url, description")
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
      <div className="h-screen w-full flex items-center justify-center p-4 md:p-6 lg:p-8">
        <div className="w-full max-w-4xl h-full max-h-[90vh] overflow-y-auto px-2 md:px-6">
          <div className="sticky top-0 py-3 z-10 mb-4">
            <button
              onClick={() => setSelectedParty(null)}
              className="w-full max-w-md mx-auto block px-6 py-2 md:py-3 bg-gradient-to-r from-primary to-primary-glow text-foreground rounded-lg font-semibold hover:from-primary hover:to-primary-glow text-sm md:text-base"
            >
              ✕ Close
            </button>
          </div>
          
          <div className="space-y-4 md:space-y-6 pb-4">
            {selectedParty.photo_url && (
              <img
                src={selectedParty.photo_url}
                alt={selectedParty.name}
                className="w-full max-w-2xl mx-auto h-auto object-contain rounded-lg"
              />
            )}
            
            <div className="text-center space-y-4 md:space-y-6 max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">{selectedParty.name}</h2>
              <p className="text-sm md:text-base lg:text-lg text-muted-foreground">
                {new Date(selectedParty.date).toLocaleDateString()}
              </p>
              {selectedParty.description && (
                <p className="text-sm md:text-base lg:text-lg text-foreground whitespace-pre-wrap">
                  {selectedParty.description}
                </p>
              )}
              
              <button
                onClick={onLoginPrompt}
                className="w-full max-w-md mx-auto block px-4 py-3 md:py-4 bg-gradient-to-r from-primary to-primary-glow text-foreground rounded-lg font-semibold hover:from-primary hover:to-primary-glow text-sm md:text-base lg:text-lg"
              >
                Login to Purchase
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedProduction) {
    const productionParties = parties.filter(p => p.production_id === selectedProduction.id);
    return (
      <div className="h-screen w-full flex items-center justify-center p-4 md:p-6 lg:p-8">
        <div className="w-full max-w-4xl h-full max-h-[90vh] overflow-y-auto px-2 md:px-6">
          <div className="sticky top-0 py-3 z-10 mb-4">
            <button
              onClick={() => setSelectedProduction(null)}
              className="w-full max-w-md mx-auto block px-6 py-2 md:py-3 bg-gradient-to-r from-primary to-primary-glow text-foreground rounded-lg font-semibold hover:from-primary hover:to-primary-glow text-sm md:text-base"
            >
              ✕ Close
            </button>
          </div>
          
          <div className="text-center space-y-4 md:space-y-6 pb-4 max-w-2xl mx-auto">
            {selectedProduction.logo_url && (
              <img
                src={selectedProduction.logo_url}
                alt={selectedProduction.name}
                className="w-full max-w-sm md:max-w-md h-auto object-contain mx-auto"
              />
            )}
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">{selectedProduction.name}</h2>
            {selectedProduction.description && (
              <p className="text-foreground text-base md:text-lg whitespace-pre-wrap leading-relaxed">
                {selectedProduction.description}
              </p>
            )}
          </div>
        </div>
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
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
      <div className="flex justify-center mb-6 md:mb-8">
        <div className="w-full max-w-sm md:max-w-md">
          <BrowseMenu value={browseMode} onValueChange={setBrowseMode} />
        </div>
      </div>
      
      <div className="flex overflow-x-auto md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 lg:gap-6 pb-4 mb-6 px-4 justify-start md:justify-center">
        {browseMode === "production" ? (
          productions.map((production) => (
            <div
              key={production.id}
              onClick={() => handleProductionClick(production)}
              className="flex-shrink-0 cursor-pointer flex flex-col items-center"
            >
              {production.logo_url ? (
                <img
                  src={production.logo_url}
                  alt={production.name}
                  className="w-24 h-24 object-contain rounded-lg"
                />
              ) : (
                <div className="w-24 h-24 bg-muted flex items-center justify-center rounded-lg">
                  <span className="text-xs text-center font-semibold text-foreground p-2">{production.name}</span>
                </div>
              )}
              <p className="text-xs text-center mt-2 max-w-[96px] text-foreground">{production.name}</p>
            </div>
          ))
        ) : (
          parties.map((party) => (
            <div
              key={party.id}
              onClick={() => handlePartyClick(party)}
              className="flex-shrink-0 cursor-pointer flex flex-col items-center"
            >
              {party.photo_url ? (
                <img
                  src={party.photo_url}
                  alt={party.name}
                  className="w-32 h-24 object-cover rounded-lg"
                />
              ) : (
                <div className="w-32 h-24 bg-muted flex items-center justify-center rounded-lg">
                  <span className="text-xs text-center p-2" style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}>{party.name}</span>
                </div>
              )}
              <p className="text-xs text-center mt-2 max-w-[128px]" style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}>{party.name}</p>
            </div>
          ))
        )}
      </div>

      <div className="relative mb-6 max-w-md md:max-w-lg lg:max-w-xl mx-auto px-4">
        <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 text-foreground h-5 w-5 md:h-6 md:w-6" style={{ color: '#000000' }} />
        <Input
          type="text"
          placeholder={browseMode === 'production' ? t('browse_by_production') : browseMode === 'party' ? t('browse_by_party') : t('browse_by_date')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="auth-input pl-10 md:pl-12 py-4 md:py-5 text-base md:text-lg rounded-2xl h-12 md:h-14 overflow-hidden text-ellipsis text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {browseMode === "party" && !carouselOnly && searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {(displayItems as Party[]).map((party) => (
            <div
              key={party.id}
              onClick={() => handlePartyClick(party)}
              className="cursor-pointer w-full rounded-lg overflow-hidden hover:scale-105 transition-transform"
            >
              {party.photo_url ? (
                <img
                  src={party.photo_url}
                  alt={party.name}
                  className="w-full h-48 md:h-56 lg:h-64 object-cover"
                />
              ) : (
                <div className="w-full h-48 md:h-56 lg:h-64 bg-muted flex items-center justify-center">
                  <span className="text-center p-4 text-sm md:text-base" style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}>{party.name}</span>
                </div>
              )}
              <div className="p-4 md:p-5">
                <h3 className="font-semibold text-base md:text-lg" style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}>{party.name}</h3>
                <p className="text-sm md:text-base" style={{ color: isBackgroundDark ? '#888888' : '#666666' }}>
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