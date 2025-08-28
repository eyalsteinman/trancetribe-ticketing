import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PartyDetails from "./PartyDetails";

export default function UserParties({ user }) {
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [showSocialsDialog, setShowSocialsDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadParties = useCallback(async () => {
    const { data, error } = await supabase.from("parties").select("*");
    if (!error) setParties(data);
  }, []);

  useEffect(() => {
    loadParties();

    const subscription = supabase
      .channel("public:parties")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "parties" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setParties((prev) => prev.filter((p) => p.id !== payload.old.id));
          } else if (payload.eventType === "INSERT") {
            setParties((prev) => [...prev, payload.new]);
          } else if (payload.eventType === "UPDATE") {
            setParties((prev) =>
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


  const goBackToPartyList = () => {
    setSelectedParty(null);
  };


  return (
    <div className="relative w-full max-w-3xl mx-auto p-4">
      {!selectedParty && (
        <div className="grid grid-cols-1 gap-4">
          {parties.map((party) => (
            <Card
              key={party.id}
              onClick={() => setSelectedParty(party)}
              className="cursor-pointer hover:shadow-lg transition"
            >
              <CardContent>
                <h2 className="text-lg font-semibold">{party.name}</h2>
                <p className="text-sm text-muted-foreground">{party.date}</p>
              </CardContent>
            </Card>
          ))}
        </div>
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
