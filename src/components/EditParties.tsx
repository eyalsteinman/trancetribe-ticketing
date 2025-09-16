import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Edit, Trash2, Upload, X, ArrowUpDown } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useBackground } from '@/contexts/BackgroundContext';
import TicketManager from './TicketManager';
import Footer from '@/components/ui/footer';

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
  optional_socials: string[];
  obligatory_socials: string[];
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
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [editTicketTypes, setEditTicketTypes] = useState<any[]>([]);
  const [editMaxTicketsPerUser, setEditMaxTicketsPerUser] = useState<number>(1);
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

  const handleEditParty = async (party: Party) => {
    console.log('Loading party for edit:', party);
    setEditingParty(party);
    setEditName(party.name);
    setEditDate(party.date);
    setEditStartTime((party as any).start_time || '');
    setEditEndTime((party as any).end_time || '');
    
    // Load social networks properly by reconstructing the format
    const loadedSocials: string[] = [];
    const optionalSocials = (party as any).optional_socials || [];
    const obligatorySocials = (party as any).obligatory_socials || [];
    
    console.log('Loading social networks:', { optionalSocials, obligatorySocials });
    
    optionalSocials.forEach((social: string) => loadedSocials.push(`${social}_optional`));
    obligatorySocials.forEach((social: string) => loadedSocials.push(`${social}_obligatory`));
    
    console.log('Loaded socials for form:', loadedSocials);
    setEditRequiredSocials(loadedSocials);
    setSelectedPhoto(null);
    setEditMaxTicketsPerUser((party as any).max_tickets_per_user || 1);
    
    // Load existing ticket types for this party
    try {
      const { data: ticketTypesData, error } = await supabase
        .from('ticket_types')
        .select('*')
        .eq('party_id', party.id)
        .order('price', { ascending: true });
      
      if (!error && ticketTypesData) {
        setEditTicketTypes(ticketTypesData.map(tt => ({
          id: tt.id,
          label: tt.label,
          price: tt.price,
          quantity: tt.quantity,
          sold: tt.sold
        })));
      }
    } catch (error) {
      console.error('Error loading ticket types:', error);
    }
    
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

      // Update party details
      const { error: partyError } = await (supabase as any)
        .from('parties')
        .update({
          name: editName.trim(),
          date: editDate,
          start_time: editStartTime || null,
          end_time: editEndTime || null,
          photo_url: photoUrl,
          description: (editingParty as any).description ?? null,
          price: (editingParty as any).price ?? null,
          is_free: (editingParty as any).is_free ?? false,
          optional_socials: editRequiredSocials.filter(s => s.includes('_optional')).map(s => s.replace('_optional', '')),
          obligatory_socials: editRequiredSocials.filter(s => s.includes('_obligatory')).map(s => s.replace('_obligatory', '')),
          production_id: (editingParty as any).production_id || null,
          ticket_count: (editingParty as any).ticket_count || null,
          max_tickets_per_user: editMaxTicketsPerUser
        })
        .eq('id', editingParty.id);

      if (partyError) {
        throw partyError;
      }

      // Update ticket types - first delete existing ones, then insert new ones
      const { error: deleteError } = await supabase
        .from('ticket_types')
        .delete()
        .eq('party_id', editingParty.id);

      if (deleteError) {
        console.error('Error deleting old ticket types:', deleteError);
      }

      // Insert new ticket types if any
      if (editTicketTypes.length > 0) {
        const ticketTypesToInsert = editTicketTypes
          .filter(ticket => ticket.label && ticket.label.trim()) // Only save tickets with labels
          .map(ticket => ({
            party_id: editingParty.id,
            label: ticket.label.trim(),
            price: ticket.price || 0,
            quantity: ticket.quantity || 0
          }));

        if (ticketTypesToInsert.length > 0) {
          const { error: ticketTypesError } = await supabase
            .from('ticket_types')
            .insert(ticketTypesToInsert);

          if (ticketTypesError) {
            console.error('Error saving ticket types:', ticketTypesError);
            toast({
              title: "Warning", 
              description: "Party updated but ticket types failed to save",
              variant: "destructive"
            });
            return;
          }
        }
      }

      toast({
        title: "Success",
        description: "Party updated successfully!",
      });
      setEditingParty(null);
      setSelectedPhoto(null);
      setEditTicketTypes([]);
      loadParties();
    } catch (error) {
      console.error('Error updating party:', error);
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

      // Remove related QR codes first to avoid FK issues
      await (supabase as any)
        .from('qr_codes')
        .delete()
        .eq('party_id', partyId);

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
        className="min-h-screen p-4 sm:p-6 transition-colors duration-500"
        style={{ 
          backgroundColor
        }}
      >
          <PageHeader
            title="Edit Party"
            onBack={cancelEdit}
          />
          
          <div className="w-full max-w-2xl mx-auto pt-20 px-4 space-y-6 text-left">

          <Card className="w-full">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Time</label>
                  <Input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Time</label>
                  <Input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                  />
                </div>
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

              <div className="flex items-center gap-2">
                <input
                  id="editIsFree"
                  type="checkbox"
                  defaultChecked={(editingParty as any).is_free || false}
                  onChange={(e) => setEditingParty((p) => p ? { ...p, is_free: e.target.checked } as any : p)}
                  className="h-4 w-4"
                />
                <label htmlFor="editIsFree" className="text-sm">Free Party</label>
              </div>

              <div>
                <label className="text-sm font-medium">Max Tickets Per User</label>
                <Input
                  type="number"
                  min="1"
                  value={editMaxTicketsPerUser}
                  onChange={(e) => setEditMaxTicketsPerUser(parseInt(e.target.value) || 1)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ticket Management Section */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Ticket Types</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketManager
                tickets={editTicketTypes}
                onChange={setEditTicketTypes}
                maxTicketsPerUser={editMaxTicketsPerUser}
                onMaxTicketsChange={setEditMaxTicketsPerUser}
              />
            </CardContent>
          </Card>

          {/* Social Networks Section */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Social Networks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Required Social Media</label>
                <div className="space-y-2">
                  {['instagram', 'facebook', 'whatsapp', 'tiktok'].map((platform) => (
                    <div key={platform} className="flex items-center gap-4">
                      <span className="w-20 text-sm capitalize">{platform}</span>
                      <div className="flex gap-2">
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={editRequiredSocials.includes(`${platform}_optional`)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditRequiredSocials(prev => [...prev.filter(s => !s.startsWith(platform)), `${platform}_optional`]);
                              } else {
                                setEditRequiredSocials(prev => prev.filter(s => s !== `${platform}_optional`));
                              }
                            }}
                            className="h-3 w-3"
                          />
                          <span className="text-xs">Optional</span>
                        </label>
                        <label className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={editRequiredSocials.includes(`${platform}_obligatory`)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditRequiredSocials(prev => [...prev.filter(s => !s.startsWith(platform)), `${platform}_obligatory`]);
                              } else {
                                setEditRequiredSocials(prev => prev.filter(s => s !== `${platform}_obligatory`));
                              }
                            }}
                            className="h-3 w-3"
                          />
                          <span className="text-xs">Required</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photo Section */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Party Photo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingParty.photo_url && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Current photo:</p>
                  <div className="relative">
                    <img 
                      src={editingParty.photo_url} 
                      alt={editingParty.name}
                      className="w-full max-w-sm h-auto rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removePartyPhoto(editingParty)}
                      className="absolute top-2 right-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {editingParty.photo_url ? 'Replace Photo' : 'Upload Photo'}
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                />
                {selectedPhoto && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedPhoto.name}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="w-full">
            <CardContent className="pt-6">
              <Button
                onClick={savePartyChanges}
                disabled={loading || !editName.trim() || !editDate}
                className="w-full"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
          
          {/* Footer */}
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-4 sm:p-6 transition-colors duration-500"
      style={{ 
        backgroundColor
      }}
    >
        <PageHeader
          title="Edit Parties"
          onBack={onBack}
        />
        
        <div className="w-full max-w-4xl mx-auto pt-20 px-4 space-y-6 text-left">
          <Card className="w-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>All Parties</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortAscending(!sortAscending)}
                  className="flex items-center gap-2"
                >
                  <ArrowUpDown className="h-4 w-4" />
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
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="font-semibold text-sm sm:text-base">{party.name}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {new Date(party.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        {showActive && (
                          <div className="text-xs text-green-600 font-medium mt-1">Active</div>
                        )}
                        {showEnded && (
                          <div className="text-xs text-red-600 font-medium mt-1">Ended</div>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditParty(party)}
                          className="flex items-center gap-1 text-xs sm:text-sm w-full sm:w-auto"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Edit</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 border-red-600 text-white text-xs sm:text-sm w-full sm:w-auto"
                            >
                              <Trash2 className="h-3 w-3 text-white" />
                              <span className="text-white">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Delete Party</AlertDialogTitle>
                              <AlertDialogDescription className="text-white">
                                Are you sure you want to delete {party.name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="text-white">Cancel</AlertDialogCancel>
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
                          className="w-full h-auto object-contain rounded-md max-h-48"
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
        
        {/* Footer */}
        <Footer />
        </div>
    </div>
  );
};

export default EditParties;