import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QRCode from "react-qr-code";

export default function UserParties({ user }) {
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [showSocialsDialog, setShowSocialsDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  // Ticket purchase states
  const [step, setStep] = useState("partyList"); // partyList, ticketSelection, friendDetails, review, payment, confirmation
  const [ticketCount, setTicketCount] = useState(1);
  const [friends, setFriends] = useState([]);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

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

  const generateQRCode = async (party) => {
    setLoading(true);
    const qrData = `${user.id}-${party.id}`;

    const { error } = await supabase.from("qr_codes").upsert(
      {
        user_id: user.id,
        party_id: party.id,
        code: qrData,
        is_approved: false,
      },
      { onConflict: "user_id,party_id" }
    );

    if (!error) {
      setQrCode(qrData);
    }
    setLoading(false);
  };

  const goBackToPartyList = () => {
    setSelectedParty(null);
    setQrCode(null);
    setStep("partyList");
  };

  const handlePurchase = async () => {
    setPaymentProcessing(true);
    // Simulate payment logic
    setTimeout(() => {
      setPaymentProcessing(false);
      setStep("confirmation");
      generateQRCode(selectedParty);
    }, 2000);
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto p-4">
      {step === "partyList" && (
        <div className="grid grid-cols-1 gap-4">
          {parties.map((party) => (
            <Card
              key={party.id}
              onClick={() => {
                setSelectedParty(party);
                setStep("ticketSelection");
              }}
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

      {selectedParty && step !== "partyList" && (
        <>
          <Button
            variant="outline"
            size="icon"
            onClick={goBackToPartyList}
            aria-label="Back"
            className="absolute top-4 left-4 z-[9999] on-color back-button"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <Card className="mt-12">
            <CardContent>
              <h2 className="text-xl font-bold mb-4">{selectedParty.name}</h2>

              {step === "ticketSelection" && (
                <div className="space-y-4">
                  <label>Number of Tickets:</label>
                  <input
                    type="number"
                    min="1"
                    value={ticketCount}
                    onChange={(e) => setTicketCount(Number(e.target.value))}
                    className="border rounded p-2 w-20"
                  />
                  <Button onClick={() => setStep("friendDetails")}>
                    Continue
                  </Button>
                </div>
              )}

              {step === "friendDetails" && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Assign tickets to friends</h3>
                  {[...Array(ticketCount)].map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      placeholder={`Friend ${i + 1} name`}
                      className="border rounded p-2 w-full"
                      onChange={(e) => {
                        const newFriends = [...friends];
                        newFriends[i] = e.target.value;
                        setFriends(newFriends);
                      }}
                    />
                  ))}
                  <Button onClick={() => setStep("review")}>Review Order</Button>
                </div>
              )}

              {step === "review" && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Review your order</h3>
                  <p>Event: {selectedParty.name}</p>
                  <p>Date: {selectedParty.date}</p>
                  <p>Tickets: {ticketCount}</p>
                  <ul className="list-disc ml-5">
                    {friends.map((f, i) => (
                      <li key={i}>{f || `Friend ${i + 1}`}</li>
                    ))}
                  </ul>
                  <Button onClick={() => setStep("payment")}>Proceed to Payment</Button>
                </div>
              )}

              {step === "payment" && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Payment</h3>
                  <Button onClick={handlePurchase} disabled={paymentProcessing}>
                    {paymentProcessing ? "Processing..." : "Pay Now"}
                  </Button>
                </div>
              )}

              {step === "confirmation" && (
                <div className="flex flex-col items-center space-y-4">
                  {qrCode && <QRCode value={qrCode} />}
                  <p className="text-sm text-muted-foreground">
                    Tickets confirmed! Share with your friends.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={showSocialsDialog} onOpenChange={setShowSocialsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update your socials</DialogTitle>
          </DialogHeader>
          <p>Please add missing social links to continue.</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
