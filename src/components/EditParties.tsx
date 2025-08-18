import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Edit, Trash2, Upload, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useBackground } from '@/contexts/BackgroundContext';

interface EditPartiesProps {
  onBack: () => void;
}

interface Party {
  id: string;
  name: string;
  date: string;
  is_active: boolean;
  photo_url: string | null;
  created_at: string;
  description: string | null;
  price: number | null;
  is_free: boolean;
  required_socials: string[];
}

interface Production {
  id: string;
  name: string;
  logo_url: string | null;
}

const EditParties = ({ onBack }: EditPartiesProps) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [editName, setEditName] = useState('');
  const [editDate, setEditDate] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingParties, setLoadingParties] = useState(true);
  const [sortAscending, setSortAscending] = useState(true); // Default to soonest first
  const [editRequiredSocials, setEditRequiredSocials] = useState<string[]>([]);
  const [productions, setProductions] = useState<Production[]>([]);
  const [productionLogo, setProductionLogo] = useState<string | null>(null);
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  useEffect(() => {
    loadParties();
    loadProductions();
  }, []);

  useEffect(() => {
    loadParties();
  }, [sortAscending]);

  const loadProductions = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('productions')
        .select('id, name, logo_url')
        .order('name');
      if (!error && data) setProductions(data);
    } catch (error) {
      console.error('Error loading productions:', error);
    }
  };

  const loadParties = async () => {
    setLoadingParties(true);
    try {
      const { data, error } = await (supabase as any)
        .from('parties')
        .select('*')
        .order('date', { ascending: sortAscending });

      if (error) {
        console.error('Error loading parties:', error);
        toast({
          title: "Error",
          description: "Failed to load parties",
          variant: "destructive"
        });
      } else {
        setParties(data || []);
      }
    } catch (error) {
      console.error('Error loading parties:', error);
    } finally {
      setLoadingParties(false);
    }
  };

  const handleEditParty = (party: Party) => {
    setEditingParty(party);
    setEditName(party.name);
    setEditDate(party.date);
    setEditRequiredSocials(Array.isArray((party as any).required_socials) ? (party as any).required_socials : []);
    setSelectedPhoto(null);
    
    // Load production logo if party has a production
    if ((party as any).production_id) {
      const production = productions.find(p => p.id === (party as any).production_id);
      setProductionLogo(production?.logo_url || null);
    } else {
      setProductionLogo(null);
    }
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!selectedPhoto) return null;

    const fileExt = selectedPhoto.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('party-photos')
      .upload(fileName, selectedPhoto);

    if (error) {
      console.error('Photo upload error:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('party-photos')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const removePhoto = async (photoUrl: string) => {
    try {
      const fileName = photoUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('party-photos')
          .remove([fileName]);
      }
    } catch (error) {
      console.error('Error removing photo:', error);
    }
  };

  const savePartyChanges = async () => {
    if (!editingParty || !editName.trim() || !editDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let photoUrl = editingParty.photo_url;

      // Upload new photo if selected
      if (selectedPhoto) {
        // Remove old photo if exists
        if (editingParty.photo_url) {
          await removePhoto(editingParty.photo_url);
        }
        photoUrl = await uploadPhoto();
      }

      const { error } = await (supabase as any)
        .from('parties')
        .update({
          name: editName.trim(),
          date: editDate,
          photo_url: photoUrl,
          description: (editingParty as any).description ?? null,
          price: (editingParty as any).price ?? null,
          is_free: (editingParty as any).is_free ?? false,
          required_socials: editRequiredSocials,
          production_id: (editingParty as any).production_id || null
        })
        .eq('id', editingParty.id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Party updated successfully!",
        });
        setEditingParty(null);
        setSelectedPhoto(null);
        loadParties();
  // Remove duplicate loadParties call
  // loadParties();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update party",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removePartyPhoto = async (party: Party) => {
    if (!party.photo_url) return;

    setLoading(true);
    try {
      // Remove photo from storage
      await removePhoto(party.photo_url);

      // Update party record to remove photo_url
      const { error } = await (supabase as any)
        .from('parties')
        .update({ photo_url: null })
        .eq('id', party.id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Photo removed successfully!",
        });
        loadParties();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove photo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteParty = async (partyId: string) => {
    setLoading(true);
    try {
      const party = parties.find(p => p.id === partyId);
      
      // Remove photo if exists
      if (party?.photo_url) {
        await removePhoto(party.photo_url);
      }

      const { error } = await (supabase as any)
        .from('parties')
        .delete()
        .eq('id', partyId);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Party deleted successfully!",
        });
        loadParties();
  // Remove duplicate loadParties call
  // loadParties();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete party",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingParty(null);
    setSelectedPhoto(null);
    setEditName('');
    setEditDate('');
  };

  if (editingParty) {
    return (
      <div 
        className="min-h-screen p-4 transition-colors duration-500"
        style={{ 
          backgroundColor
        }}
      >
          <div className="max-w-md mx-auto space-y-6 text-left">
            <Button variant="outline" size="icon" onClick={cancelEdit} aria-label="Back" className="absolute top-4 right-4 z-[9999] on-color back-button">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 
              className="text-xl font-bold"
              style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
            >
              Edit Party
            </h1>

          <Card>
            <CardHeader>
              <CardTitle>Party Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Production</label>
                <div className="space-y-2">
                  <select
                    className="w-full p-2 border rounded-md"
                    value={(editingParty as any).production_id || ''}
                    onChange={(e) => setEditingParty((p) => p ? { ...p, production_id: e.target.value || null } as any : p)}
                  >
                    <option value="">Select production (optional)</option>
                    {productions.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {(editingParty as any).production_id && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Current production logo:</span>
                      {productionLogo ? (
                        <img 
                          src={productionLogo} 
                          alt="Production logo"
                          className="h-8 w-8 object-cover rounded"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">No logo</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Party Name</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter party name"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Party Date</label>
                <Input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="w-full border rounded-md p-2"
                  rows={4}
                  defaultValue={(editingParty as any).description || ''}
                  onChange={(e) => setEditingParty((p) => p ? { ...p, description: e.target.value } as any : p)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Price (ILS)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    defaultValue={(editingParty as any).price ?? ''}
                    onChange={(e) => setEditingParty((p) => p ? { ...p, price: e.target.value ? Number(e.target.value) : null } as any : p)}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <input
                    id="editIsFree"
                    type="checkbox"
                    defaultChecked={(editingParty as any).is_free || false}
                    onChange={(e) => setEditingParty((p) => p ? { ...p, is_free: e.target.checked } as any : p)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="editIsFree" className="text-sm">Free Party</label>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Required Social Networks</label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {['facebook','instagram','tiktok','x'].map((key) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editRequiredSocials.includes(key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditRequiredSocials([...editRequiredSocials, key]);
                          } else {
                            setEditRequiredSocials(editRequiredSocials.filter((s) => s !== key));
                          }
                        }}
                        className="h-4 w-4"
                      />
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Current Photo</label>
                {editingParty.photo_url ? (
                  <div className="space-y-2">
                    <img 
                      src={editingParty.photo_url} 
                      alt={editingParty.name}
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removePartyPhoto(editingParty)}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 border-red-600 text-white"
                    >
                      <span className="text-white">Remove Current Photo</span>
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No photo uploaded</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Upload New Photo</label>
                <div className="flex items-center gap-2">
                  <Input
                    id="editPhoto"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('editPhoto')?.click()}
                    className="flex items-center gap-2 text-foreground"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="truncate max-w-32">
                      {selectedPhoto ? selectedPhoto.name : 'Choose New Photo'}
                    </span>
                  </Button>
                  {selectedPhoto && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setSelectedPhoto(null)}
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <Button 
                onClick={savePartyChanges}
                disabled={loading || !editName.trim() || !editDate}
                className="w-full"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-4 transition-colors duration-500"
      style={{ 
        backgroundColor
      }}
    >
        <div className="max-w-md mx-auto space-y-6 text-left">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={onBack} aria-label="Back" className="absolute top-4 right-4 z-[9999] on-color back-button">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 
              className="text-xl font-bold"
              style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
            >
              Edit Parties
            </h1>
          </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>All Parties</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortAscending(!sortAscending)}
                className="flex items-center gap-2"
              >
                {sortAscending ? "Latest First" : "Soonest First"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingParties ? (
              <p className="text-center text-muted-foreground">Loading parties...</p>
            ) : parties.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No parties found.
              </p>
            ) : (
              parties.map((party) => {
                const partyDate = new Date(party.date);
                const now = new Date();
                const isToday = partyDate.toDateString() === now.toDateString();
                const isWithin24Hours = partyDate.getTime() > now.getTime() - 24 * 60 * 60 * 1000 && partyDate.getTime() <= now.getTime();
                const hasEnded = partyDate.getTime() < now.getTime() - 24 * 60 * 60 * 1000;
                
                // Find the soonest party that hasn't ended
                const upcomingParties = parties.filter(p => new Date(p.date).getTime() >= now.getTime() - 24 * 60 * 60 * 1000);
                const soonestParty = upcomingParties.length > 0 ? upcomingParties.reduce((earliest, current) => 
                  new Date(current.date) < new Date(earliest.date) ? current : earliest
                ) : null;
                
                const showActive = soonestParty?.id === party.id && (isToday || isWithin24Hours);
                const showEnded = hasEnded;

                return (
                  <div
                    key={party.id}
                    data-party-id={party.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold">{party.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(party.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        {showActive && (
                          <div className="text-xs text-green-600 font-medium mt-1">Active</div>
                        )}
                        {showEnded && (
                          <div className="text-xs text-red-600 font-medium mt-1">Ended</div>
                        )}
                      </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditParty(party)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 border-red-600 text-white"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="text-white">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Party</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {party.name}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteParty(party.id)}
                              disabled={loading}
                      className="bg-red-600 hover:bg-red-700 border-red-600 text-white"
                            >
                              {loading ? "Deleting..." : <span className="text-white">Delete</span>}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    </div>
                    
                    {party.photo_url && (
                      <div className="w-full">
                        <img 
                          src={party.photo_url} 
                          alt={party.name}
                          className="w-full h-32 object-cover rounded-md"
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditParties;

