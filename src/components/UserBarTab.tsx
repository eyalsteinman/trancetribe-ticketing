import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

interface BarTabItem {
  id: string;
  production_id: string;
  item_name: string;
  regular_price: number;
  friend_price?: number;
  barcode: string;
  is_active: boolean;
  status: string;
}

interface UserBarTabProps {
  userId: string;
  selectedProduction: string | null;
  onBack: () => void;
}

const UserBarTab: React.FC<UserBarTabProps> = ({ userId, selectedProduction, onBack }) => {
  const [barTabs, setBarTabs] = useState<BarTabItem[]>([]);
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedProduction) {
      loadBarTabItems();
    }
  }, [selectedProduction]);

  const loadBarTabItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bar_tab_items")
      .select("*")
      .eq("production_id", selectedProduction)
      .order("item_name");

    if (error) {
      console.error("Error loading bar tab items:", error.message);
      setLoading(false);
      return;
    }

    if (data) {
      setBarTabs(data);
      const qrMap: Record<string, string> = {};
      for (const tab of data) {
        if (tab.barcode) {
          qrMap[tab.id] = await QRCode.toDataURL(tab.barcode);
        }
      }
      setQrDataUrls(qrMap);
    }
    setLoading(false);
  };

  const deleteBarTab = async (barTabId: string) => {
    const { error } = await supabase
      .from("bar_tab_items")
      .update({ status: "deleted" })
      .eq("id", barTabId);

    if (error) {
      console.error("Error deleting bar tab:", error.message);
    } else {
      setBarTabs((prev) => prev.filter((tab) => tab.id !== barTabId));
      setQrDataUrls((prev) => {
        const updated = { ...prev };
        delete updated[barTabId];
        return updated;
      });
    }
  };

  return (
    <div className="relative min-h-screen p-4">
      <Button
        variant="outline"
        size="icon"
        onClick={onBack}
        aria-label="Back"
        className="absolute top-4 left-4 z-50"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <h2 className="text-xl font-bold mb-4 text-center">My Bar Tabs</h2>

      {loading && <p className="text-center">Loading bar tabs...</p>}

      {!loading && barTabs.length === 0 && (
        <p className="text-center">No active bar tabs found.</p>
      )}

      <div className="grid gap-4 mt-8">
        {barTabs.map((barTab) => (
          <Card key={barTab.id} className="shadow-md">
            <CardHeader>
              <CardTitle>{barTab.item_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Regular Price: ₪{barTab.regular_price}</p>
              {barTab.friend_price && <p>Friend Price: ₪{barTab.friend_price}</p>}

              {qrDataUrls[barTab.id] && (
                <img
                  src={qrDataUrls[barTab.id]}
                  alt="Bar Tab QR"
                  className="mx-auto w-48 h-48"
                />
              )}

              <div className="flex justify-between">
                <Button
                  variant="destructive"
                  onClick={() => deleteBarTab(barTab.id)}
                >
                  Delete
                </Button>
                <Button>Purchase</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserBarTab;
