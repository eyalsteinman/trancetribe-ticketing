import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BarTabItem {
  id: string;
  user_id: string;
  production_id: string;
  total_amount: number;
  remaining_amount: number;
  barcode: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Production {
  id: string;
  name: string;
  logo_url: string | null;
}

interface BarTab {
  id: string;
  item_name: string;
  regular_price: number;
  discounted_price: number;
}

interface UserBarTabProps {
  userId: string;
  onBack: () => void;
}

const UserBarTab: React.FC<UserBarTabProps> = ({ userId, onBack }) => {
  const [productions, setProductions] = useState<Production[]>([]);
  const [selectedProduction, setSelectedProduction] = useState<string>('');
  const [availableBarTabs, setAvailableBarTabs] = useState<BarTab[]>([]);
  const [userBarTabs, setUserBarTabs] = useState<BarTabItem[]>([]);
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState<string>('');
  const [selectedBarTab, setSelectedBarTab] = useState<string>('');
  const [useDiscount, setUseDiscount] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProductions();
    loadUserBarTabs();
  }, [userId]);

  useEffect(() => {
    if (selectedProduction) {
      loadAvailableBarTabs();
    }
  }, [selectedProduction]);

  const loadProductions = async () => {
    const { data, error } = await supabase
      .from("productions")
      .select("id, name, logo_url")
      .order("name");

    if (error) {
      console.error("Error loading productions:", error.message);
      return;
    }

    if (data) {
      setProductions(data);
    }
  };

  const loadAvailableBarTabs = async () => {
    const { data, error } = await supabase
      .from("bar_tabs")
      .select("*")
      .eq("production_id", selectedProduction)
      .eq("is_active", true)
      .order("item_name");

    if (error) {
      console.error("Error loading bar tabs:", error.message);
      return;
    }

    if (data) {
      setAvailableBarTabs(data);
    }
  };

  const loadUserBarTabs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_bar_tabs")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at");

    if (error) {
      console.error("Error loading user bar tabs:", error.message);
      setLoading(false);
      return;
    }

    if (data) {
      setUserBarTabs(data);
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
      .from("user_bar_tabs")
      .delete()
      .eq("id", barTabId);

    if (error) {
      console.error("Error deleting bar tab:", error.message);
      toast({
        title: "Error",
        description: "Failed to delete bar tab",
        variant: "destructive"
      });
    } else {
      setUserBarTabs((prev) => prev.filter((tab) => tab.id !== barTabId));
      setQrDataUrls((prev) => {
        const updated = { ...prev };
        delete updated[barTabId];
        return updated;
      });
      toast({
        title: "Success",
        description: "Bar tab deleted successfully"
      });
    }
  };

  const purchaseBarTab = async () => {
    if (!selectedBarTab || !purchaseAmount || !selectedProduction) {
      toast({
        title: "Error",
        description: "Please select a bar tab item and enter amount",
        variant: "destructive"
      });
      return;
    }

    const selectedItem = availableBarTabs.find(tab => tab.id === selectedBarTab);
    if (!selectedItem) return;

    const amount = parseFloat(purchaseAmount);
    const price = useDiscount ? selectedItem.discounted_price : selectedItem.regular_price;
    const totalAmount = useDiscount ? amount : amount;
    const remainingAmount = amount;

    const barcode = `${userId}-${selectedProduction}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    setLoading(true);
    const { error } = await supabase
      .from("user_bar_tabs")
      .insert({
        user_id: userId,
        production_id: selectedProduction,
        total_amount: totalAmount,
        remaining_amount: remainingAmount,
        barcode: barcode,
        status: "active"
      });

    if (error) {
      console.error("Error purchasing bar tab:", error.message);
      toast({
        title: "Error",
        description: "Failed to purchase bar tab",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Bar tab purchased successfully"
      });
      setPurchaseAmount('');
      setSelectedBarTab('');
      setUseDiscount(false);
      loadUserBarTabs();
    }
    setLoading(false);
  };

  const selectedBarTabItem = availableBarTabs.find(tab => tab.id === selectedBarTab);
  const calculatedPrice = selectedBarTabItem 
    ? (useDiscount ? selectedBarTabItem.discounted_price : selectedBarTabItem.regular_price)
    : 0;

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

      <h2 className="text-xl font-bold mb-4 text-center mt-12">My Bar Tabs</h2>

      {/* Production Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Choose Production</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProduction} onValueChange={setSelectedProduction}>
            <SelectTrigger>
              <SelectValue placeholder="Select a production..." />
            </SelectTrigger>
            <SelectContent>
              {productions.map((production) => (
                <SelectItem key={production.id} value={production.id}>
                  {production.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Purchase Bar Tab */}
      {selectedProduction && availableBarTabs.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Purchase Bar Tab</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Item</label>
              <div className="space-y-2">
                {availableBarTabs.map((item) => (
                  <div 
                    key={item.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedBarTab === item.id 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedBarTab(item.id)}
                  >
                    <div className="font-medium">{item.item_name}</div>
                    <div className="text-sm text-muted-foreground">
                      Regular: ₪{item.regular_price} | Discounted: ₪{item.discounted_price}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedBarTab && (
              <>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useDiscount"
                    checked={useDiscount}
                    onChange={(e) => setUseDiscount(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="useDiscount" className="text-sm">
                    Use discounted price (₪{selectedBarTabItem?.discounted_price})
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Amount (₪{calculatedPrice} per unit)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter amount"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                  />
                </div>

                <Button
                  onClick={purchaseBarTab}
                  disabled={loading || !purchaseAmount}
                  className="w-full"
                >
                  {loading ? "Processing..." : `Purchase ₪${purchaseAmount} Bar Tab`}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-center">Loading bar tabs...</p>}

      {!loading && userBarTabs.length === 0 && (
        <p className="text-center">No active bar tabs found.</p>
      )}

      <div className="grid gap-4">
        {userBarTabs.map((barTab) => (
          <Card key={barTab.id} className="shadow-md">
            <CardHeader>
              <CardTitle>Bar Tab #{barTab.id.slice(-6)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Total Amount: ₪{barTab.total_amount}</p>
              <p>Remaining: ₪{barTab.remaining_amount}</p>

              {qrDataUrls[barTab.id] && (
                <img
                  src={qrDataUrls[barTab.id]}
                  alt="Bar Tab QR"
                  className="mx-auto w-48 h-48"
                />
              )}

              <div className="flex justify-between">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Bar Tab</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this bar tab? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteBarTab(barTab.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserBarTab;
