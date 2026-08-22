import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Wine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AppLayout from '@/components/ui/app-layout';
import EmptyState from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

import BuyTicket from "@/components/BuyTicket";

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
  created_by: string;
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
  const [selectedBarTab, setSelectedBarTab] = useState<string>('');
  const [productionsMap, setProductionsMap] = useState<Record<string, Production>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadProductions();
    loadUserBarTabs();
  }, [userId]);

  useEffect(() => {
    if (selectedProduction && selectedProduction !== 'none') {
      loadAvailableBarTabs();
    }
  }, [selectedProduction]);

  const loadProductions = async () => {
    const { data, error } = await supabase
      .from("productions")
      .select("id, name, logo_url, created_by")
      .order("name");

    if (error) {
      console.error("Error loading productions:", error.message);
      return;
    }

    if (data) {
      setProductions(data);
      // Create productions map for quick lookup
      const prodMap: Record<string, Production> = {};
      data.forEach(prod => {
        prodMap[prod.id] = prod;
      });
      setProductionsMap(prodMap);
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
    console.log("Attempting to delete bar tab:", barTabId);
    const { error } = await supabase
      .from("user_bar_tabs")
      .delete()
      .eq("id", barTabId);

    if (error) {
      console.error("Error deleting bar tab:", error.message, error);
      toast({
        title: "Error",
        description: `Failed to delete bar tab: ${error.message}`,
        variant: "destructive"
      });
    } else {
      console.log("Bar tab deleted successfully");
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


  const selectedBarTabItem = availableBarTabs.find(tab => tab.id === selectedBarTab);

  return (
    <AppLayout
      title="My Bar Tabs"
      subtitle="Buy a tab and show its QR code at the bar"
      onBack={onBack}
      width="lg"
    >


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
              <SelectItem value="none">None</SelectItem>
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
      {selectedProduction && selectedProduction !== 'none' && availableBarTabs.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {productionsMap[selectedProduction] 
                ? `Purchase Bar Tab for ${productionsMap[selectedProduction].name}` 
                : 'Purchase Bar Tab'}
            </CardTitle>
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

            {selectedBarTab && selectedBarTabItem && (
              <BuyTicket
                ticketAmount={selectedBarTabItem.discounted_price}
                currency="ILS"
                adminId={productionsMap[selectedProduction]?.created_by}
                className="w-full"
                onPaymentSuccess={async () => {
                  // Create bar tab entry with full regular price as total, discounted price was paid
                  const barcode = `BARTAB-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                  
                  const { error } = await supabase
                    .from('user_bar_tabs')
                    .insert({
                      user_id: userId,
                      production_id: selectedProduction,
                      total_amount: selectedBarTabItem.regular_price, // Show full price in wallet
                      remaining_amount: selectedBarTabItem.regular_price,
                      barcode: barcode
                    });
                  
                  if (error) {
                    toast({
                      title: "Error",
                      description: "Failed to create bar tab",
                      variant: "destructive"
                    });
                  } else {
                    toast({
                      title: "Success",
                      description: "Bar tab purchased successfully!"
                    });
                  }
                  
                  setSelectedBarTab('');
                  loadUserBarTabs();
                }}
              />
            )}
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="space-y-4" aria-live="polite">
          <Skeleton className="h-40 w-full rounded-xl" />
          <p className="sr-only">Loading bar tabs</p>
        </div>
      )}

      {!loading && userBarTabs.length === 0 && (
        <EmptyState
          icon={<Wine className="h-7 w-7" />}
          title="No active bar tabs"
          description="Pick a production above and buy a bar tab — your QR code appears here right after payment."
        />
      )}


      <div className="grid gap-4">
        {userBarTabs.map((barTab) => {
          const production = productionsMap[barTab.production_id];
          const purchaseDate = new Date(barTab.created_at);
          
          return (
            <Card key={barTab.id} className="shadow-md">
              <CardHeader>
                <CardTitle>Bar Tab #{barTab.id.slice(-6)}</CardTitle>
                {production && (
                  <p className="text-sm text-muted-foreground">{production.name}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {purchaseDate.toLocaleDateString()} {purchaseDate.toLocaleTimeString()}
                </p>
              </CardHeader>
              <CardContent className="space-y-4 relative">
                <div>
                  <p>Total Amount: ₪{barTab.total_amount}</p>
                  <p>Remaining: ₪{barTab.remaining_amount}</p>
                  {/* Show discounted price instead of total amount */}
                  <p className="text-sm text-muted-foreground">Bar Tab Cost: ₪{Math.round(barTab.total_amount * 0.9)}</p>
                </div>

                {qrDataUrls[barTab.id] && (
                  <img
                    src={qrDataUrls[barTab.id]}
                    alt="Bar Tab QR"
                    className="mx-auto w-48 h-48"
                  />
                )}

                <div className="absolute top-4 right-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
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
          );
        })}
      </div>
    </AppLayout>
  );

};

export default UserBarTab;
