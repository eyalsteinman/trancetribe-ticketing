import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import Footer from '@/components/ui/footer';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { useBackground } from '@/contexts/BackgroundContext';

interface BarTabManagerProps {
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
}

const BarTabManager = ({ user, onBack }: BarTabManagerProps) => {
  const [productions, setProductions] = useState<Production[]>([]);
  const [selectedProduction, setSelectedProduction] = useState<string>('');
  const [barTabItems, setBarTabItems] = useState<BarTabItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  useEffect(() => {
    loadProductions();
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
        .eq('created_by', user.id)
        .order('name');

      if (error) throw error;
      setProductions(data || []);
    } catch (error) {
      console.error('Error loading productions:', error);
      toast({
        title: "Error",
        description: "Failed to load productions",
        variant: "destructive"
      });
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
      toast({
        title: "Error",
        description: "Failed to load bar tab items",
        variant: "destructive"
      });
    }
  };

  const addBarTabItem = () => {
    const newItem: BarTabItem = {
      id: `temp-${Date.now()}`,
      item_name: '',
      regular_price: 0,
      discounted_price: 0
    };
    setBarTabItems([...barTabItems, newItem]);
  };

  const updateBarTabItem = (id: string, field: keyof BarTabItem, value: string | number) => {
    setBarTabItems(items =>
      items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeBarTabItem = (id: string) => {
    setBarTabItems(items => items.filter(item => item.id !== id));
  };

  const saveBarTabItems = async () => {
    if (!selectedProduction) {
      toast({
        title: "Error",
        description: "Please select a production first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Delete existing items for this production
      await supabase
        .from('bar_tabs')
        .delete()
        .eq('production_id', selectedProduction);

      // Insert new items
      const itemsToInsert = barTabItems
        .filter(item => item.item_name.trim())
        .map(item => ({
          production_id: selectedProduction,
          created_by: user.id,
          item_name: item.item_name.trim(),
          regular_price: item.regular_price,
          discounted_price: item.discounted_price,
          is_active: true
        }));

      if (itemsToInsert.length > 0) {
        const { error } = await supabase
          .from('bar_tabs')
          .insert(itemsToInsert);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Bar tab items saved successfully",
      });

      loadBarTabItems();
    } catch (error) {
      console.error('Error saving bar tab items:', error);
      toast({
        title: "Error",
        description: "Failed to save bar tab items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen p-4 transition-colors duration-500"
      style={{ backgroundColor }}
    >
      <PageHeader
        title="Bar Tab Manager"
        onBack={onBack}
      />
      
      <div className="max-w-md mx-auto pt-20 space-y-6">

        <Card>
          <CardHeader>
            <CardTitle>Select Production</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              className="w-full p-2 border rounded-md"
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
          </CardContent>
        </Card>

        {selectedProduction && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Bar Tab Items</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBarTabItem}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {barTabItems.map((item) => (
                <div key={item.id} className="border rounded p-3 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Bar Item</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBarTabItem(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Item Name</label>
                      <Input
                        placeholder="e.g. Beer, Cocktail, Shot"
                        value={item.item_name}
                        onChange={(e) => updateBarTabItem(item.id, 'item_name', e.target.value)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Regular Price (ILS)</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={item.regular_price || ""}
                          onChange={(e) => updateBarTabItem(item.id, 'regular_price', Number(e.target.value) || 0)}
                          placeholder="Regular price"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Discounted Price (ILS)</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={item.discounted_price || ""}
                          onChange={(e) => updateBarTabItem(item.id, 'discounted_price', Number(e.target.value) || 0)}
                         placeholder="Discount price"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {barTabItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No bar tab items added. Click "Add Item" to create drink options.
                </p>
              )}

              {barTabItems.length > 0 && (
                <Button
                  onClick={saveBarTabItems}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Saving..." : "Save Bar Tab Items"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default BarTabManager;