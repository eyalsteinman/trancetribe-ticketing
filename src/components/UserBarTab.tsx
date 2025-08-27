import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { useBackground } from '@/contexts/BackgroundContext';
import QRCode from 'qrcode';

interface UserBarTabProps {
  user: User;
  onBack: () => void;
}

interface Production {
  id: string;
  name: string;
  logo_url: string | null;
}

interface BarTabItem {
  id: string;
  item_name: string;
  regular_price: number;
  discounted_price: number;
  production_id: string;
}

interface UserBarTabData {
  id: string;
  production_id: string;
  total_amount: number;
  remaining_amount: number;
  barcode: string;
  status: string;
  productions: {
    name: string;
    logo_url: string | null;
  };
}

const UserBarTab = ({ user, onBack }: UserBarTabProps) => {
  const [productions, setProductions] = useState<Production[]>([]);
  const [selectedProduction, setSelectedProduction] = useState<string>('');
  const [barTabItems, setBarTabItems] = useState<BarTabItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [userBarTabs, setUserBarTabs] = useState<UserBarTabData[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [deletingQR, setDeletingQR] = useState<string | null>(null);
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  useEffect(() => {
    loadProductions();
    loadUserBarTabs();
  }, []);

  useEffect(() => {
    if (selectedProduction) {
      loadBarTabItems();
    }
  }, [selectedProduction]);

  const loadProductions = async () => {
    try {
      const { data, error } = await supabase
        .from('productions')
        .select('id, name, logo_url')
        .order('name');

      if (error) throw error;
      
      // Filter productions that have active bar tab items
      const productionsWithBarTabs = await Promise.all(
        (data || []).map(async (production) => {
          const { data: barTabs } = await supabase
            .from('bar_tabs')
            .select('id')
            .eq('production_id', production.id)
            .eq('is_active', true)
            .limit(1);
          
          return barTabs && barTabs.length > 0 ? production : null;
        })
      );

      setProductions(productionsWithBarTabs.filter(Boolean) as Production[]);
    } catch (error) {
      console.error('Error loading productions:', error);
    }
  };

  const loadBarTabItems = async () => {
    if (!selectedProduction) return;

    try {
      const { data, error } = await supabase
        .from('bar_tabs')
        .select('*')
        .eq('production_id', selectedProduction)
        .eq('is_active', true)
        .order('item_name');

      if (error) throw error;
      setBarTabItems(data || []);
    } catch (error) {
      console.error('Error loading bar tab items:', error);
    }
  };

  const loadUserBarTabs = async () => {
    try {
      const { data, error } = await supabase
        .from('user_bar_tabs')
        .select(`
          *,
          productions (
            name,
            logo_url
          )
        `)
        .eq('user_id', user.id)
        .neq('status', 'deleted');

      if (error) throw error;
      setUserBarTabs((data as UserBarTabData[]) || []);
      
      // Generate QR code for the first active bar tab
      if (data && data.length > 0) {
        const qrData = await QRCode.toDataURL(data[0].barcode);
        setQrDataUrl(qrData);
      }
    } catch (error) {
      console.error('Error loading user bar tabs:', error);
    }
  };

  const purchaseBarTab = async (totalAmount: number) => {
    if (!selectedProduction) return;

    setLoading(true);
    try {
      // Generate unique barcode
      const barcode = `BAR-${user.id}-${selectedProduction}-${Date.now()}`;

      const { error } = await supabase
        .from('user_bar_tabs')
        .insert({
          user_id: user.id,
          production_id: selectedProduction,
          total_amount: totalAmount,
          remaining_amount: totalAmount,
          barcode: barcode,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bar tab purchased successfully!",
      });

      loadUserBarTabs();
      setSelectedProduction('');
    } catch (error) {
      console.error('Error purchasing bar tab:', error);
      toast({
        title: "Error",
        description: "Failed to purchase bar tab",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, itemId) => {
      const item = barTabItems.find(i => i.id === itemId);
      return total + (item ? item.discounted_price : 0);
    }, 0);
  };

  const handleItemSelection = (itemId: string, selected: boolean) => {
    setSelectedItems(prev => 
      selected 
        ? [...prev, itemId]
        : prev.filter(id => id !== itemId)
    );
  };

  const deleteQRCode = async (barTabId: string) => {
    try {
      const { error } = await supabase
        .from('user_bar_tabs')
        .update({ status: 'deleted' })
        .eq('id', barTabId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "QR code deleted successfully!",
      });

      loadUserBarTabs();
    } catch (error) {
      console.error('Error deleting QR code:', error);
      toast({
        title: "Error",
        description: "Failed to delete QR code",
        variant: "destructive"
      });
    } finally {
      setDeletingQR(null);
    }
  };

  return (
    <div 
      className="min-h-screen p-4 transition-colors duration-500"
      style={{ backgroundColor }}
    >
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onBack}
            aria-label="Back"
            className="absolute top-4 right-4 z-[9999] on-color back-button"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 
            className="text-xl font-bold"
            style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
          >
            Bar Tab
          </h1>
        </div>

        {/* Active Bar Tabs */}
        {userBarTabs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Active Bar Tabs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userBarTabs.map((barTab) => (
                <div key={barTab.id} className="border rounded p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{barTab.productions.name}</h3>
                    <span className="text-sm text-muted-foreground">
                      {barTab.remaining_amount} ILS remaining
                    </span>
                  </div>
                  
                  {qrDataUrl && (
                    <div className="text-center">
                      <img 
                        src={qrDataUrl} 
                        alt="Bar Tab QR Code" 
                        className="mx-auto w-48 h-48"
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        Show this QR code to the bartender
                      </p>
                    </div>
                  )}
                  
                  <div className="text-sm">
                    <p>Total purchased: {barTab.total_amount} ILS</p>
                    <p>Remaining: {barTab.remaining_amount} ILS</p>
                  </div>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeletingQR(barTab.id)}
                    className="w-full mt-2"
                  >
                    Delete QR Code
                  </Button>

                  {deletingQR === barTab.id && (
                    <div className="mt-2 p-3 border rounded bg-yellow-50 dark:bg-yellow-900/20">
                      <p className="text-sm font-medium mb-2">Are you sure you want to delete this QR code?</p>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteQRCode(barTab.id)}
                        >
                          Yes, Delete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingQR(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Purchase New Bar Tab */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Bar Tab</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Production</label>
              <select
                className="w-full p-2 border rounded-md mt-1"
                value={selectedProduction}
                onChange={(e) => setSelectedProduction(e.target.value)}
              >
                <option value="">Select a production...</option>
                {productions.map((production) => (
                  <option key={production.id} value={production.id}>
                    {production.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedProduction && barTabItems.length > 0 && (
              <>
                <div>
                  <h4 className="font-medium mb-2">Select Drinks</h4>
                  <div className="space-y-2">
                    {barTabItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-2 border rounded">
                        <input
                          type="checkbox"
                          id={`item-${item.id}`}
                          checked={selectedItems.includes(item.id)}
                          onChange={(e) => handleItemSelection(item.id, e.target.checked)}
                          className="w-4 h-4"
                        />
                        <label htmlFor={`item-${item.id}`} className="flex-1 cursor-pointer">
                          <span>{item.item_name}</span>
                        </label>
                        <div className="text-right">
                          <div className="text-sm line-through text-muted-foreground">
                            {item.regular_price} ILS
                          </div>
                          <div className="font-medium text-green-600">
                            {item.discounted_price} ILS
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedItems.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-medium">Total for selected drinks:</span>
                      <span className="font-bold text-lg">{calculateTotal()} ILS</span>
                    </div>
                    
                    <Button
                      onClick={() => purchaseBarTab(calculateTotal())}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? "Processing..." : `Purchase Bar Tab (${calculateTotal()} ILS)`}
                    </Button>
                  </div>
                )}
                
                {selectedItems.length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    Please select one or more drinks to see the total price.
                  </div>
                )}
              </>
            )}

            {selectedProduction && barTabItems.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No bar tab items available for this production.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserBarTab;