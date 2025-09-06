import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search } from "lucide-react";
import PartyDetails from "./PartyDetails";
import BrowseMenu from "./BrowseMenu";
import PageHeader from "./ui/page-header";

export default function UserParties({ user, onBack }) {
  const [parties, setParties] = useState([]);
  const [productions, setProductions] = useState([]);
  const [filteredParties, setFilteredParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [showSocialsDialog, setShowSocialsDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [browseMode, setBrowseMode] = useState("production");

  const loadParties = useCallback(async () => {
    const { data: partiesData, error: partiesError } = await supabase
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
    
    if (!partiesError) {
      setParties(partiesData);
      setFilteredParties(partiesData);
    }

    // Load productions for search
    const { data: productionsData, error: productionsError } = await supabase
      .from("productions")
      .select("id, name, logo_url")
      .order('name');
    
    if (!productionsError) {
      setProductions(productionsData);
    }
  }, []);

  useEffect(() => {
    loadParties();

    // Check if a specific party was selected from dashboard
    const selectedPartyId = localStorage.getItem('selectedPartyId');
    if (selectedPartyId) {
      localStorage.removeItem('selectedPartyId');
      // Wait for parties to load then select the party
      setTimeout(() => {
        const party = parties.find(p => p.id === selectedPartyId);
        if (party) {
          setSelectedParty(party);
        }
      }, 100);
    }

    const subscription = supabase
      .channel("public:parties")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "parties" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setParties((prev) => prev.filter((p) => p.id !== payload.old.id));
            setFilteredParties((prev) => prev.filter((p) => p.id !== payload.old.id));
          } else if (payload.eventType === "INSERT") {
            setParties((prev) => [...prev, payload.new]);
            setFilteredParties((prev) => [...prev, payload.new]);
          } else if (payload.eventType === "UPDATE") {
            setParties((prev) =>
              prev.map((p) => (p.id === payload.new.id ? payload.new : p))
            );
            setFilteredParties((prev) =>
              prev.map((p) => (p.id === payload.new.id ? payload.new : p))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [loadParties]);

  // Filter parties based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredParties(parties);
    } else {
      const filtered = parties.filter(party => {
        const productionName = party.productions?.name || '';
        return productionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               party.name.toLowerCase().includes(searchQuery.toLowerCase());
      });
      setFilteredParties(filtered);
    }
  }, [searchQuery, parties]);


  const goBackToPartyList = () => {
    setSelectedParty(null);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="relative w-full max-w-2xl mx-auto p-6">
        {!selectedParty && (
          <>
            <PageHeader
              title="Events & Parties"
              onBack={onBack}
              showBackButton={true}
            />
          
          
          
            <BrowseMenu value={browseMode} onValueChange={setBrowseMode} />
            
            {/* Browse Section */}
            <div className="mb-8">
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
                {browseMode === "production" ? (
                  productions.map((production) => (
                    <div
                      key={production.id}
                      onClick={() => {
                        const productionParties = parties.filter(p => p.production_id === production.id);
                        if (productionParties.length > 0) {
                          setSelectedParty(productionParties[0]);
                        }
                      }}
                      className="flex-shrink-0 cursor-pointer group snap-start"
                    >
                      <div className="w-24 h-24 overflow-hidden bg-card shadow-card hover-lift">
                        {production.logo_url ? (
                          <img
                            src={production.logo_url}
                            alt={production.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <span className="text-xs text-center px-2 font-semibold">{production.name}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-center mt-2 truncate w-24 font-medium text-muted-foreground">{production.name}</p>
                    </div>
                  ))
                ) : browseMode === "party" ? (
                  parties.map((party) => (
                    <div
                      key={party.id}
                      onClick={() => setSelectedParty(party)}
                      className="flex-shrink-0 cursor-pointer group snap-start"
                    >
                      <div className="w-32 h-24 overflow-hidden bg-card shadow-card hover-lift">
                        {party.photo_url ? (
                          <img
                            src={party.photo_url}
                            alt={party.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <span className="text-xs text-center px-2 font-semibold">{party.name}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-center mt-2 truncate w-32 font-medium text-muted-foreground">{party.name}</p>
                    </div>
                  ))
                ) : (
                  parties.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((party) => (
                    <div
                      key={party.id}
                      onClick={() => setSelectedParty(party)}
                      className="flex-shrink-0 cursor-pointer group snap-start"
                    >
                      <div className="w-32 h-24 overflow-hidden bg-card shadow-card hover-lift">
                        {party.photo_url ? (
                          <img
                            src={party.photo_url}
                            alt={party.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <span className="text-xs text-center px-2 font-semibold">{party.name}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-center mt-2 truncate w-32 font-medium text-muted-foreground">{party.name}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Search bar */}
            <div className="mb-8 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Search events by name or production..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-base rounded-2xl border-2 focus:border-primary bg-card shadow-sm"
              />
            </div>
            
            {/* Events Grid */}
            <div className="space-y-6">
              {filteredParties.map((party) => (
                <div
                  key={party.id}
                  onClick={() => setSelectedParty(party)}
                  className="w-full cursor-pointer group"
                >
                  {party.photo_url ? (
                    <div className="relative w-full h-64 overflow-hidden">
                      <img
                        src={party.photo_url}
                        alt={party.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h2 className="text-xl font-bold text-white mb-2">{party.name}</h2>
                        <p className="text-sm text-white/90">
                          {new Date(party.date).toLocaleDateString('en-GB', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric',
                            weekday: 'long'
                          })}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <div className="text-center p-6">
                        <h2 className="text-xl font-bold text-foreground mb-2">{party.name}</h2>
                        <p className="text-base text-muted-foreground mb-3">
                          {new Date(party.date).toLocaleDateString('en-GB', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric',
                            weekday: 'long'
                          })}
                        </p>
                        {party.description && (
                          <p className="text-sm text-muted-foreground">{party.description}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Event Info Footer */}
                  <div className="p-4 w-full">
                    <Button 
                      variant="default"
                      size="sm" 
                      className="w-full bg-primary text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedParty(party);
                      }}
                    >
                      View Event Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {selectedParty && (
          <PartyDetails party={selectedParty} user={user} onBack={goBackToPartyList} />
        )}

        <Dialog open={showSocialsDialog} onOpenChange={setShowSocialsDialog}>
          <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Update your socials</DialogTitle>
            </DialogHeader>
            <p>Please add missing social links to continue.</p>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
