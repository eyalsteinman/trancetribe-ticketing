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
  const [productions, setProductions] = useState<Production[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [browseMode, setBrowseMode] = useState("production");
  const { isBackgroundDark } = useBackground();
  const { t } = useLanguage();

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
        <div className="max-w-md mx-auto">
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setSelectedParty(null)}
              className="px-4 py-2 bg-primary text-white rounded-lg"
            >
              ✕ Close
            </button>
          </div>
          
          <div className="px-4 space-y-4">
            {selectedParty.photo_url && (
              <img
                src={selectedParty.photo_url}
                alt={selectedParty.name}
                className="w-full h-auto object-cover rounded-lg"
              />
            )}
            
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2" style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}>{selectedParty.name}</h2>
              <p className="text-sm mb-4" style={{ color: isBackgroundDark ? '#888888' : '#666666' }}>
                {new Date(selectedParty.date).toLocaleDateString()}
              </p>
              {selectedParty.description && (
                <p className="text-sm mb-4" style={{ color: isBackgroundDark ? '#cccccc' : '#333333' }}>
                  {selectedParty.description}
                </p>
              )}
              
              <button
                onClick={onLoginPrompt}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold"
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
      <div className="min-h-screen w-full p-4">
        <div className="max-w-md mx-auto">
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setSelectedProduction(null)}
              className="px-4 py-2 bg-primary text-white rounded-lg"
            >
              ✕ Close
            </button>
          </div>
          
          <div className="mb-6 text-center px-4">
            {selectedProduction.logo_url ? (
              <img
                src={selectedProduction.logo_url}
                alt={selectedProduction.name}
                className="w-full max-w-xs h-auto object-contain mx-auto mb-4"
              />
            ) : (
              <div className="w-full max-w-xs h-32 bg-muted flex items-center justify-center mx-auto mb-4 rounded-lg">
                <span className="font-semibold text-center" style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}>{selectedProduction.name}</span>
              </div>
            )}
            <h2 className="text-xl font-bold mb-2" style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}>{selectedProduction.name}</h2>
            <p className="text-sm" style={{ color: isBackgroundDark ? '#cccccc' : '#333333' }}>
              Production description would go here if available in the database.
            </p>
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
                  <span className="text-xs text-center font-semibold text-white">{production.name}</span>
                </div>
              )}
              <p className="text-xs text-center mt-2 truncate text-white">{production.name}</p>
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
                  <span className="text-xs text-center p-2" style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}>{party.name}</span>
                </div>
              )}
              <p className="text-xs text-center mt-2 truncate" style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}>{party.name}</p>
            </div>
          ))
        )}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black h-5 w-5" style={{ color: '#000000' }} />
        <Input
          type="text"
          placeholder={browseMode === 'production' ? t('browse_by_production') : browseMode === 'party' ? t('browse_by_party') : t('browse_by_date')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="auth-input pl-10 py-4 text-base rounded-2xl h-12 overflow-hidden text-ellipsis text-black placeholder:text-black/50"
        />
      </div>

      {browseMode === "party" && !carouselOnly && (
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
                  <span className="text-center p-4" style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}>{party.name}</span>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold" style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}>{party.name}</h3>
                <p className="text-sm" style={{ color: isBackgroundDark ? '#888888' : '#666666' }}>
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