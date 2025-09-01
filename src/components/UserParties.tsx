import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search } from "lucide-react";
import PartyDetails from "./PartyDetails";

export default function UserParties({ user, onBack }) {
  const [parties, setParties] = useState([]);
  const [productions, setProductions] = useState([]);
  const [filteredParties, setFilteredParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [showSocialsDialog, setShowSocialsDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    <div className="relative w-full max-w-3xl mx-auto p-4">
      {!selectedParty && (
        <>
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            aria-label="Back to Dashboard"
            className="absolute top-4 right-4 z-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-xl font-bold mb-4 absolute top-4 left-4">Events and Parties</h2>
          
          
          
          {/* Horizontal scrollable productions */}
          {productions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Browse by Production</h3>
              <div className="flex gap-3 overflow-x-auto pb-3">
                {productions.map((production) => (
                  <div
                    key={production.id}
                    onClick={() => {
                      const productionParties = parties.filter(p => p.production_id === production.id);
                      if (productionParties.length > 0) {
                        setSelectedParty(productionParties[0]);
                      }
                    }}
                    className="flex-shrink-0 cursor-pointer hover:opacity-75 transition-opacity"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden border bg-white">
                      {production.logo_url ? (
                        <img
                          src={production.logo_url}
                          alt={production.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <span className="text-xs text-center px-1">{production.name}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-center mt-1 truncate w-20">{production.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search bar */}
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search parties by production name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {filteredParties.map((party) => (
              <Card
                key={party.id}
                onClick={() => setSelectedParty(party)}
                className="cursor-pointer hover:shadow-lg transition overflow-hidden"
              >
                <CardContent className="p-0">
                  {party.photo_url ? (
                    <div className="w-full h-80 overflow-hidden rounded-lg">
                      <img
                        src={party.photo_url}
                        alt={party.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-80 bg-muted flex items-center justify-center rounded-lg">
                      <div className="text-center p-4">
                        <h2 className="text-lg font-semibold">{party.name}</h2>
                        <p className="text-sm text-muted-foreground">{party.date}</p>
                        {party.description && (
                          <p className="text-sm text-muted-foreground mt-2">{party.description}</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
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
  );
}
