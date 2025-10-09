import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Check, UserCheck, Users, MessageCircle } from 'lucide-react';
import { useBackground } from '@/contexts/BackgroundContext';
import PageHeader from '@/components/ui/page-header';
import SocialDialog from './SocialDialog';
import { User } from '@supabase/supabase-js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AdminGuestListProps {
  user: User;
  onBack: () => void;
}

interface ArrivingGuest {
  id: string;
  user_id: string;
  code: string;
  created_at: string;
  is_approved: boolean;
  auto_approved: boolean;
  profiles: {
    display_name: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  } | null;
}

interface ScannedGuest {
  id: string;
  user_id: string;
  scanned_at: string;
  profiles: {
    display_name: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  } | null;
}

const AdminGuestList = ({ user, onBack }: AdminGuestListProps) => {
  const [parties, setParties] = useState<any[]>([]);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'scanned' | 'arriving'>('arriving');
  const [arrivingGuests, setArrivingGuests] = useState<ArrivingGuest[]>([]);
  const [scannedGuests, setScannedGuests] = useState<ScannedGuest[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'surname' | 'recent' | 'approved'>('recent');
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
  const [emailDialog, setEmailDialog] = useState<{open: boolean; guestId: string; email: string}>({
    open: false,
    guestId: '',
    email: ''
  });
  const [emailMessage, setEmailMessage] = useState('');
  const [socialDialog, setSocialDialog] = useState<{open: boolean; userId: string; socials: any[]}>({
    open: false,
    userId: '',
    socials: []
  });
  
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  // Sort arriving guests when sortBy changes
  const sortedArrivingGuests = useMemo(() => {
    return [...arrivingGuests].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.profiles?.first_name || '').localeCompare(b.profiles?.first_name || '');
        case 'surname':
          return (a.profiles?.last_name || '').localeCompare(b.profiles?.last_name || '');
        case 'approved':
          return Number(b.is_approved) - Number(a.is_approved);
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [arrivingGuests, sortBy]);

  useEffect(() => {
    loadParties();
  }, []);

  useEffect(() => {
    if (selectedParty) {
      loadGuests();
    }
  }, [selectedParty, activeTab]);


  const loadParties = async () => {
    try {
      const { data, error } = await supabase
        .from('parties')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading parties:', error);
      } else {
        setParties(data || []);
        if (data && data.length > 0 && !selectedParty) {
          setSelectedParty(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading parties:', error);
    }
  };

  const loadGuests = async () => {
    if (!selectedParty) return;
    
    setLoading(true);
    try {
      if (activeTab === 'arriving') {
        // Load guests who generated QR codes but haven't been scanned yet
        const { data: qrData, error: qrError } = await supabase
          .from('qr_codes')
          .select('id, user_id, code, created_at, is_approved, auto_approved')
          .eq('is_scanned', false)
          .eq('party_id', selectedParty)
          .order('created_at', { ascending: true });

        if (qrError) {
          console.error('Error loading arriving guests:', qrError);
          return;
        }

        if (!qrData || qrData.length === 0) {
          setArrivingGuests([]);
          return;
        }

        const userIds = qrData.map(qr => qr.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, first_name, last_name, email, phone_number')
          .in('user_id', userIds);

        if (profilesError) {
          console.error('Error loading profiles:', profilesError);
          return;
        }

        const combinedData = qrData.map(qr => {
          const profile = profilesData?.find(p => p.user_id === qr.user_id);
          return {
            ...qr,
            profiles: profile || null
          };
        });

        setArrivingGuests(combinedData);
      } else {
        // Load scanned guests
        const { data: qrData, error: qrError } = await supabase
          .from('qr_codes')
          .select('id, user_id, scanned_at')
          .eq('is_scanned', true)
          .eq('scanned_by', user.id)
          .eq('party_id', selectedParty)
          .order('scanned_at', { ascending: true });

        if (qrError) {
          console.error('Error loading scanned guests:', qrError);
          return;
        }

        if (!qrData || qrData.length === 0) {
          setScannedGuests([]);
          return;
        }

        const userIds = qrData.map(qr => qr.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, first_name, last_name, email, phone_number')
          .in('user_id', userIds);

        if (profilesError) {
          console.error('Error loading profiles:', profilesError);
          return;
        }

        const combinedData = qrData.map(qr => {
          const profile = profilesData?.find(p => p.user_id === qr.user_id);
          return {
            ...qr,
            profiles: profile || null
          };
        });

        setScannedGuests(combinedData);
      }
    } catch (error) {
      console.error('Error loading guests:', error);
    } finally {
      setLoading(false);
    }
  };


  const approveQR = async (qrId: string) => {
    try {
      const { error } = await supabase
        .from('qr_codes')
        .update({
          is_approved: true,
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', qrId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to approve QR code",
          variant: "destructive"
        });
        return;
      }

      // Send QR code email to the user with admin email
      const guest = arrivingGuests.find(g => g.id === qrId);
      if (guest && guest.profiles?.email) {
        try {
          await supabase.functions.invoke('send-qr-email-with-admin', {
            body: {
              qrCodeId: qrId,
              adminEmail: user.email || 'admin@example.com'
            }
          });
        } catch (emailError) {
          console.error('Error sending QR code email:', emailError);
        }
      }

      toast({
        title: "Success",
        description: "QR code approved successfully and email sent to user",
      });
      
      loadGuests();
    } catch (error) {
      console.error('Error approving QR:', error);
      toast({
        title: "Error",
        description: "Failed to approve QR code",
        variant: "destructive"
      });
    }
  };

  const approveAlways = async (userId: string) => {
    try {
      // Update all QR codes for this user to be auto-approved for future
      const { error } = await supabase
        .from('qr_codes')
        .update({
          auto_approved: true,
          is_approved: true,
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to set auto-approval",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "User set to auto-approve for all future QR codes",
      });
      
      loadGuests();
    } catch (error) {
      console.error('Error setting auto-approval:', error);
      toast({
        title: "Error",
        description: "Failed to set auto-approval",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async () => {
    if (!emailMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive"
      });
      return;
    }

    try {
      if (emailDialog.guestId === 'all') {
        // Send to all arriving guests
        const userIds = arrivingGuests.map(guest => guest.user_id);
      } else if (emailDialog.guestId === 'selected') {
        // Send to selected guests
        const selectedGuestsList = arrivingGuests.filter(guest => selectedGuests.has(guest.id));
        const userIds = selectedGuestsList.map(guest => guest.user_id);
        const messagesToInsert = userIds.map(userId => ({
          created_by: user.id,
          recipient_id: userId,
          production_id: parties.find(p => p.id === selectedParty)?.production_id || null,
          subject: `Message about ${parties.find(p => p.id === selectedParty)?.name || 'your party'}`,
          content: emailMessage.trim()
        }));

        const { error } = await supabase
          .from('messages')
          .insert(messagesToInsert);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: `Message sent to ${userIds.length} guests successfully`,
        });
      } else if (emailDialog.guestId === 'selected') {
        // Send to selected guests
        const selectedGuestsList = arrivingGuests.filter(guest => selectedGuests.has(guest.id));
        const userIds = selectedGuestsList.map(guest => guest.user_id);
        const messagesToInsert = userIds.map(userId => ({
          created_by: user.id,
          recipient_id: userId,
          production_id: parties.find(p => p.id === selectedParty)?.production_id || null,
          subject: `Message about ${parties.find(p => p.id === selectedParty)?.name || 'your party'}`,
          content: emailMessage.trim()
        }));

        const { error } = await supabase
          .from('messages')
          .insert(messagesToInsert);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: `Message sent to ${userIds.length} selected guests successfully`,
        });
        setSelectedGuests(new Set());
      } else {
        // Send to single guest
        const guest = arrivingGuests.find(g => g.id === emailDialog.guestId);
        if (!guest) return;

        const { error } = await supabase
          .from('messages')
          .insert({
            created_by: user.id,
            recipient_id: guest.user_id,
            production_id: parties.find(p => p.id === selectedParty)?.production_id || null,
            subject: `Message about ${parties.find(p => p.id === selectedParty)?.name || 'your party'}`,
            content: emailMessage.trim()
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Message sent successfully",
        });
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
    
    setEmailDialog({ open: false, guestId: '', email: '' });
    setEmailMessage('');
  };

  const messageGroup = async () => {
    if (arrivingGuests.length === 0) {
      toast({
        title: "No guests to message",
        description: "There are no arriving guests to send messages to.",
        variant: "destructive",
      });
      return;
    }

    setEmailDialog({
      open: true,
      guestId: 'all',
      email: 'all-guests'
    });
  };

  const messageSelected = async () => {
    if (selectedGuests.size === 0) {
      toast({
        title: "No guests selected",
        description: "Please select guests to send messages to.",
        variant: "destructive",
      });
      return;
    }

    setEmailDialog({
      open: true,
      guestId: 'selected',
      email: 'selected-guests'
    });
  };

  const toggleGuestSelection = (guestId: string) => {
    const newSelected = new Set(selectedGuests);
    if (newSelected.has(guestId)) {
      newSelected.delete(guestId);
    } else {
      newSelected.add(guestId);
    }
    setSelectedGuests(newSelected);
  };

  const sendQRToAll = async () => {
    try {
      const { error } = await supabase.functions.invoke('send-qr-to-all', {
        body: {
          party_id: selectedParty,
          guest_list: arrivingGuests
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "QR codes sent to all guests!"
      });
    } catch (error: any) {
      console.error('Error sending QR codes:', error);
      toast({
        title: "Error",
        description: "Failed to send QR codes",
        variant: "destructive"
      });
    }
  };

  const viewSocialMedia = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_socials')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      setSocialDialog({
        open: true,
        userId,
        socials: data || []
      });
    } catch (error: any) {
      console.error('Error loading social media:', error);
      toast({
        title: "Error",
        description: "Failed to load social media information",
        variant: "destructive"
      });
    }
  };

  const selectAllGuests = () => {
    if (selectedGuests.size === arrivingGuests.length) {
      setSelectedGuests(new Set());
    } else {
      setSelectedGuests(new Set(arrivingGuests.map(g => g.id)));
    }
  };

  return (
    <div 
      className="min-h-screen transition-colors duration-500"
      style={{ 
        backgroundColor
      }}
    >
      <PageHeader
        title="Guest List"
        onBack={onBack}
      />
      
      <div className="px-4 pt-20 pb-4 space-y-4">
        {/* Party Selection */}
        {parties.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Select Party</CardTitle>
            </CardHeader>
            <CardContent>
              <select 
                className="w-full p-2 border rounded-md text-black bg-white"
                value={selectedParty || ''}
                onChange={(e) => setSelectedParty(e.target.value)}
              >
                {parties.map((party) => (
                  <option key={party.id} value={party.id}>
                    {party.name} - {new Date(party.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>
        )}

        {/* Tab Buttons */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'scanned' ? 'default' : 'outline'}
            onClick={() => setActiveTab('scanned')}
            className={`flex-1 text-sm ${
              activeTab === 'scanned' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-black border-black hover:bg-black/10'
            }`}
          >
            Scanned ({scannedGuests.length})
          </Button>
          <Button
            variant={activeTab === 'arriving' ? 'default' : 'outline'}
            onClick={() => setActiveTab('arriving')}
            className={`flex-1 text-sm ${
              activeTab === 'arriving' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-black border-black hover:bg-black/10'
            }`}
          >
            Arriving ({arrivingGuests.length})
          </Button>
        </div>

        {/* Guest Tables */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  {activeTab === 'scanned' ? 'Scanned Guests' : 'Arriving Guests'}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {activeTab === 'scanned' ? scannedGuests.length : arrivingGuests.length} guests
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : activeTab === 'scanned' ? (
              scannedGuests.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No guests scanned yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-black">#</TableHead>
                      <TableHead className="text-black">First Name</TableHead>
                      <TableHead className="text-black">Last Name</TableHead>
                      <TableHead className="text-black">Email</TableHead>
                      <TableHead className="text-black">Phone</TableHead>
                      <TableHead className="text-black">Scanned At</TableHead>
                      <TableHead className="text-black">Social</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scannedGuests.map((guest, index) => (
                      <TableRow key={guest.id}>
                        <TableCell className="text-black font-medium">{index + 1}</TableCell>
                        <TableCell className="text-black">
                          {guest.profiles?.first_name || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-black">
                          {guest.profiles?.last_name || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-black text-sm">
                          {guest.profiles?.email || 'No email'}
                        </TableCell>
                        <TableCell className="text-black text-sm">
                          {guest.profiles?.phone_number || 'No phone'}
                        </TableCell>
                        <TableCell className="text-black text-sm">
                          {new Date(guest.scanned_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewSocialMedia(guest.user_id)}
                            className="p-1"
                            title="View social media"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            ) : (
              arrivingGuests.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No arriving guests yet
                </p>
              ) : (
                <>
                  {/* Sort dropdown */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-black mr-2">Order by:</label>
                    <select 
                      className="p-2 border rounded-md text-black bg-white"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'name' | 'surname' | 'recent' | 'approved')}
                    >
                      <option value="recent">Recently Added</option>
                      <option value="name">First Name</option>
                      <option value="surname">Last Name</option>
                      <option value="approved">Approval Status</option>
                    </select>
                  </div>
                   <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead className="text-black">
                         <input
                           type="checkbox"
                           checked={selectedGuests.size === arrivingGuests.length && arrivingGuests.length > 0}
                           onChange={selectAllGuests}
                           className="mr-2"
                         />
                         #
                       </TableHead>
                       <TableHead className="text-black">First Name</TableHead>
                       <TableHead className="text-black">Last Name</TableHead>
                       <TableHead className="text-black">Email</TableHead>
                       <TableHead className="text-black">Phone</TableHead>
                       <TableHead className="text-black">Status</TableHead>
                       <TableHead className="text-black">Actions</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                      {sortedArrivingGuests.map((guest, index) => (
                        <TableRow key={guest.id}>
                          <TableCell className="text-black font-medium">
                            <input
                              type="checkbox"
                              checked={selectedGuests.has(guest.id)}
                              onChange={() => toggleGuestSelection(guest.id)}
                              className="mr-2"
                            />
                            {index + 1}
                          </TableCell>
                         <TableCell className="text-black">
                           {guest.profiles?.first_name || 'Unknown'}
                         </TableCell>
                         <TableCell className="text-black">
                           {guest.profiles?.last_name || 'Unknown'}
                         </TableCell>
                          <TableCell className="text-black text-sm">
                            {guest.profiles?.email || 'No email'}
                          </TableCell>
                          <TableCell className="text-black text-sm">
                            {guest.profiles?.phone_number || 'No phone'}
                          </TableCell>
                         <TableCell>
                          {guest.is_approved ? (
                            <Badge variant="default" className="bg-green-600">Approved</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                          {guest.auto_approved && (
                            <Badge variant="outline" className="ml-1">Auto</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {!guest.is_approved && (
                              <Button
                                size="sm"
                                onClick={() => approveQR(guest.id)}
                                className="p-1"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            {!guest.auto_approved && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => approveAlways(guest.user_id)}
                                className="p-1 text-black border-black hover:bg-black/10"
                                title="Approve always"
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEmailDialog({
                                open: true,
                                guestId: guest.id,
                                email: guest.profiles?.email || ''
                              })}
                              className="p-1 text-black border-black hover:bg-black/10"
                              title="Send message"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewSocialMedia(guest.user_id)}
                              className="p-1 text-black border-black hover:bg-black/10"
                              title="View social media"
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                 </Table>
                </>
              )
            )}
            
            {/* Message Actions - Only show for arriving tab */}
            {activeTab === 'arriving' && arrivingGuests.length > 0 && (
              <div className="space-y-3 mt-4 pt-4 border-t">
                {/* Send QR to All - separate row */}
                <div className="w-full">
                  <Button
                    onClick={sendQRToAll}
                    disabled={arrivingGuests.length === 0}
                    className="w-full"
                  >
                    Send QR to All ({arrivingGuests.length})
                  </Button>
                </div>
                
                {/* Message buttons - second row */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEmailDialog({
                      open: true,
                      guestId: 'all',
                      email: 'all-guests'
                    })}
                    className="flex-1 min-w-0 text-xs sm:text-sm"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Message All ({arrivingGuests.length})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={messageSelected}
                    disabled={selectedGuests.size === 0}
                    className="flex-1 min-w-0 text-xs sm:text-sm"
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Message Selected ({selectedGuests.size})
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Dialog */}
        <Dialog open={emailDialog.open} onOpenChange={(open) => setEmailDialog(prev => ({ ...prev, open }))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-black">Send Message</DialogTitle>
              <DialogDescription className="text-gray-600">
                Send a custom message to the selected guest(s) about their party registration.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-black">To: {
                  emailDialog.guestId === 'all' ? 'All arriving guests' : 
                  emailDialog.guestId === 'selected' ? `${selectedGuests.size} selected guests` : 
                  emailDialog.email
                }</label>
              </div>
              <div>
                <label className="text-sm font-medium text-black">Message</label>
                <textarea
                  className="w-full p-2 border rounded-md h-32 text-black"
                  placeholder="Enter your message..."
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEmailDialog({ open: false, guestId: '', email: '' })}>
                Cancel
              </Button>
              <Button onClick={sendMessage}>Send Message</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <SocialDialog
          open={socialDialog.open}
          onOpenChange={(open) => setSocialDialog(prev => ({ ...prev, open }))}
          socials={socialDialog.socials}
        />
      </div>
    </div>
  );
};

export default AdminGuestList;