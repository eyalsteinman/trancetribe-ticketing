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
import Footer from '@/components/ui/footer';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function UserParties({ user, onBack }) {
  const [parties, setParties] = useState([]);
  const [productions, setProductions] = useState([]);
  const [filteredParties, setFilteredParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [showSocialsDialog, setShowSocialsDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [browseMode, setBrowseMode] = useState("production");
  const [selectedProduction, setSelectedProduction] = useState<string | null>(null);

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

    const selectedPartyId = localStorage.getItem('selectedPartyId');
    const savedParty = localStorage.getItem('selectedParty');
    
    if (selectedPartyId) {
      localStorage.removeItem('selectedPartyId');
      setTimeout(() => {
        const party = parties.find(p => p.id === selectedPartyId);
        if (party) {
          setSelectedParty(party);
        }
      }, 100);
    } else if (savedParty) {
      try {
        const party = JSON.parse(savedParty);
        localStorage.removeItem('selectedParty');
        setTimeout(() => {
          const fullParty = parties.find(p => p.id === party.id);
          if (fullParty) {
            setSelectedParty(fullParty);
          }
        }, 100);
      } catch (error) {
        console.error('Error parsing saved party:', error);
        localStorage.removeItem('selectedParty');
      }
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

  useEffect(() => {
    let filtered = parties;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(party => {
        const productionName = party.productions?.name || '';
        return productionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               party.name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Apply browse mode filters
    if (browseMode === "production" && selectedProduction) {
      filtered = filtered.filter(party => party.production_id === selectedProduction);
    } else if (browseMode === "date") {
      // Sort by date ascending
      filtered = [...filtered].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    } else if (browseMode === "party") {
      // Sort by party name
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredParties(filtered);
  }, [searchQuery, parties, browseMode, selectedProduction]);

  const goBackToPartyList = () => {
    setSelectedParty(null);
  };

  return (
    <div className="min-h-screen bg-[#4C1D95] relative overflow-hidden">
      {/* Animated background */}
      <div className="auth-animated-bg" />
      
      <div className="w-full relative z-10">
        {!selectedParty && (
          <>
            <PageHeader
              title="Events & Parties"
              onBack={onBack}
              showBackButton={true}
            />
            
            <div className="container-section">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Search events by name or productions"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-base bg-white border-0 rounded-md"
                />
              </div>
            </div>

            <div className="container-section">
              <BrowseMenu value={browseMode} onValueChange={setBrowseMode} />
            </div>
            
            <div className="container-section pb-24">
              {browseMode === "production" ? (
                productions.length > 0 ? (
                  <Carousel className="w-full max-w-4xl mx-auto">
                    <CarouselContent>
                      {productions.map((production) => (
                        <CarouselItem key={production.id}>
                          <div 
                            className="bg-white rounded-lg overflow-hidden shadow-lg cursor-pointer"
                            onClick={() => setSelectedProduction(production.id)}
                          >
                            {production.logo_url ? (
                              <div className="w-full">
                                <img
                                  src={production.logo_url}
                                  alt={production.name}
                                  className="w-full h-auto object-contain"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-96 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                                <div className="text-center p-6">
                                  <h2 className="text-xl font-bold text-foreground mb-2">{production.name}</h2>
                                </div>
                              </div>
                            )}
                            
                            <div className="p-4">
                              <Button 
                                variant="default"
                                size="lg" 
                                className="w-full bg-[#4C1D95] hover:bg-[#5B21B6] text-white font-semibold"
                              >
                                View {production.name} events
                              </Button>
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="-left-12" />
                    <CarouselNext className="-right-12" />
                  </Carousel>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-white text-lg">No productions found</p>
                  </div>
                )
              ) : filteredParties.length > 0 ? (
                <Carousel className="w-full max-w-4xl mx-auto">
                  <CarouselContent>
                    {filteredParties.map((party) => (
                      <CarouselItem key={party.id}>
                        <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                          {party.photo_url ? (
                            <div className="w-full cursor-pointer" onClick={() => setSelectedParty(party)}>
                              <img
                                src={party.photo_url}
                                alt={party.name}
                                className="w-full h-auto object-contain max-h-[500px]"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-96 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center cursor-pointer" onClick={() => setSelectedParty(party)}>
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
                          
                          <div className="p-4">
                            <h3 className="text-lg font-bold text-foreground mb-1">{party.name}</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              {new Date(party.date).toLocaleDateString('en-GB', { 
                                day: 'numeric', 
                                month: 'long', 
                                year: 'numeric',
                                weekday: 'long'
                              })}
                            </p>
                            <Button 
                              variant="default"
                              size="lg" 
                              className="w-full bg-[#4C1D95] hover:bg-[#5B21B6] text-white font-semibold"
                              onClick={() => setSelectedParty(party)}
                            >
                              View event details
                            </Button>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="-left-12" />
                  <CarouselNext className="-right-12" />
                </Carousel>
              ) : (
                <div className="text-center py-12">
                  <p className="text-white text-lg">No events found</p>
                </div>
              )}
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
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}