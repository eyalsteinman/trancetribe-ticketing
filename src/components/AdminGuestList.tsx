import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Check, UserCheck, MessageCircle, Users, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/ui/page-header';
import SocialDialog from '@/components/SocialDialog';
import { useBackground } from '@/contexts/BackgroundContext';
import Footer from '@/components/ui/footer';

interface User {
  id: string;
  email?: string;
}

interface AdminGuestListProps {
  user: User;
  onBack: () => void;
}

interface ArrivingGuest {
  id: string;
  user_id: string;
  is_approved: boolean;
  auto_approved: boolean;
  created_at: string;
  profiles: {
    user_id: string;
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
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  } | null;
}

const AdminGuestList = ({ user, onBack }: AdminGuestListProps) => {
  const [parties, setParties] = useState<any[]>([]);
  const [selectedParty, setSelectedParty] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'scanned' | 'arriving'>('arriving');
  const [arrivingGuests, setArrivingGuests] = useState<ArrivingGuest[]>([]);
  const [scannedGuests, setScannedGuests] = useState<ScannedGuest[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'surname' | 'recent' | 'approved'>('recent');
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
  const [emailDialog, setEmailDialog] = useState({ open: false, guestId: '', email: '' });
  const [emailMessage, setEmailMessage] = useState('');
  const [socialDialog, setSocialDialog] = useState({ open: false, socials: [] });
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  // Memoized sorted arriving guests
  const sortedArrivingGuests = useMemo(() => {
    if (!arrivingGuests.length) return [];
    
    return [...arrivingGuests].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          const nameA = a.profiles?.first_name || '';
          const nameB = b.profiles?.first_name || '';
          return nameA.localeCompare(nameB);
        case 'surname':
          const surnameA = a.profiles?.last_name || '';
          const surnameB = b.profiles?.last_name || '';
          return surnameA.localeCompare(surnameB);
        case 'approved':
          if (a.is_approved === b.is_approved) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          return a.is_approved ? 1 : -1;
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
        .select('id, name, date')
        .order('date', { ascending: false });
      
      if (error) throw error;
      setParties(data || []);
      
      // Auto-select the most recent party
      if (data && data.length > 0) {
        setSelectedParty(data[0].id);
      }
    } catch (error) {
      console.error('Error loading parties:', error);
      toast({
        title: "Error",
        description: "Failed to load parties",
        variant: "destructive"
      });
    }
  };

  const loadGuests = async () => {
    if (!selectedParty) return;
    
    setLoading(true);
    try {
      if (activeTab === 'arriving') {
        // Load QR codes that haven't been scanned yet
        const { data, error } = await supabase
          .from('qr_codes')
          .select(`
            id,
            user_id,
            is_approved,
            auto_approved,
            created_at,
            profiles!inner(
              user_id,
              first_name,
              last_name,
              email,
              phone_number
            )
          `)
          .eq('party_id', selectedParty)
          .is('scanned_at', null)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setArrivingGuests(data || []);
      } else {
        // Load scanned QR codes
        const { data, error } = await supabase
          .from('qr_codes')
          .select(`
            id,
            user_id,
            scanned_at,
            profiles!inner(
              user_id,
              first_name,
              last_name,
              email,
              phone_number
            )
          `)
          .eq('party_id', selectedParty)
          .not('scanned_at', 'is', null)
          .order('scanned_at', { ascending: false });
        
        if (error) throw error;
        setScannedGuests(data || []);
      }
    } catch (error) {
      console.error('Error loading guests:', error);
      toast({
        title: "Error",
        description: "Failed to load guests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const approveQR = async (qrId: string) => {
    try {
      const { error } = await supabase
        .from('qr_codes')
        .update({ is_approved: true })
        .eq('id', qrId);
      
      if (error) throw error;

      // Send approval email
      const qrCode = arrivingGuests.find(g => g.id === qrId);
      if (qrCode?.profiles?.email) {
        try {
          await supabase.functions.invoke('send-qr-email-on-approval', {
            body: {
              email: qrCode.profiles.email,
              qrId: qrId,
              partyId: selectedParty
            }
          });
        } catch (emailError) {
          console.error('Error sending approval email:', emailError);
        }
      }

      toast({
        title: "Success",
        description: "Guest approved and email sent!",
      });
      
      loadGuests();
    } catch (error) {
      console.error('Error approving QR:', error);
      toast({
        title: "Error",
        description: "Failed to approve guest",
        variant: "destructive"
      });
    }
  };

  const approveAlways = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('qr_codes')
        .update({ auto_approved: true, is_approved: true })
        .eq('user_id', userId)
        .eq('party_id', selectedParty);
      
      if (error) throw error;

      toast({
        title: "Success",
        description: "User will be auto-approved for future events!",
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
    if (!emailMessage.trim()) return;

    try {
      let recipients: string[] = [];
      
      if (emailDialog.guestId === 'all') {
        recipients = arrivingGuests
          .filter(g => g.profiles?.email)
          .map(g => g.profiles!.email);
      } else if (emailDialog.guestId === 'selected') {
        recipients = arrivingGuests
          .filter(g => selectedGuests.has(g.id) && g.profiles?.email)
          .map(g => g.profiles!.email);
      } else {
        const guest = arrivingGuests.find(g => g.id === emailDialog.guestId);
        if (guest?.profiles?.email) {
          recipients = [guest.profiles.email];
        }
      }

      if (recipients.length === 0) {
        toast({
          title: "Error",
          description: "No valid email addresses found",
          variant: "destructive"
        });
        return;
      }

      // Send message using the guest message function
      const { error } = await supabase.functions.invoke('send-guest-message', {
        body: {
          emails: recipients,
          message: emailMessage,
          subject: 'Message from Event Administration'
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Message sent to ${recipients.length} recipient(s)`,
      });

      setEmailDialog({ open: false, guestId: '', email: '' });
      setEmailMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const messageGroup = () => {
    setEmailDialog({
      open: true,
      guestId: 'all',
      email: 'all-guests'
    });
  };

  const messageSelected = () => {
    if (selectedGuests.size === 0) return;
    setEmailDialog({
      open: true,
      guestId: 'selected',
      email: `${selectedGuests.size}-selected`
    });
  };

  const toggleGuestSelection = (guestId: string) => {
    setSelectedGuests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(guestId)) {
        newSet.delete(guestId);
      } else {
        newSet.add(guestId);
      }
      return newSet;
    });
  };

  const sendQRToAll = async () => {
    try {
      const { error } = await supabase.functions.invoke('send-qr-to-all', {
        body: {
          partyId: selectedParty
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "QR codes sent to all arriving guests!",
      });
    } catch (error) {
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
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      
      setSocialDialog({
        open: true,
        socials: []
      });
    } catch (error) {
      console.error('Error loading social media:', error);
      toast({
        title: "Error",
        description: "Failed to load social media profiles",
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
      className="min-h-screen p-4 sm:p-6"
      style={{ backgroundColor }}
    >
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Guest Management"
          onBack={onBack}
          showBackButton={true}
        />
        
        <div className="space-y-6 pt-20">
          {/* Party Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Event</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedParty} onValueChange={setSelectedParty}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an event..." />
                </SelectTrigger>
                <SelectContent>
                  {parties.map((party) => (
                    <SelectItem key={party.id} value={party.id}>
                      {party.name} - {new Date(party.date).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Guest Lists */}
          <Card>
            <CardHeader>
              <CardTitle>Guest Lists</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'scanned' | 'arriving')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="arriving" className="relative">
                    Arriving Guests
                    {arrivingGuests.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {arrivingGuests.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="scanned" className="relative">
                    Checked In
                    {scannedGuests.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {scannedGuests.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="arriving" className="space-y-4">
                  {loading ? (
                    <p className="text-center text-muted-foreground py-8">Loading guests...</p>
                  ) : arrivingGuests.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No arriving guests yet
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {/* Sort dropdown */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <label className="text-sm font-medium">Sort by:</label>
                        <Select value={sortBy} onValueChange={(value: 'name' | 'surname' | 'recent' | 'approved') => setSortBy(value)}>
                          <SelectTrigger className="w-full sm:w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="recent">Recently Added</SelectItem>
                            <SelectItem value="name">First Name</SelectItem>
                            <SelectItem value="surname">Last Name</SelectItem>
                            <SelectItem value="approved">Approval Status</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Responsive table wrapper */}
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-16">
                                <input
                                  type="checkbox"
                                  checked={selectedGuests.size === arrivingGuests.length && arrivingGuests.length > 0}
                                  onChange={selectAllGuests}
                                  className="mr-2"
                                />
                                #
                              </TableHead>
                              <TableHead className="min-w-[100px]">First Name</TableHead>
                              <TableHead className="min-w-[100px]">Last Name</TableHead>
                              <TableHead className="min-w-[200px] hidden sm:table-cell">Email</TableHead>
                              <TableHead className="min-w-[120px] hidden md:table-cell">Phone</TableHead>
                              <TableHead className="min-w-[100px]">Status</TableHead>
                              <TableHead className="min-w-[200px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedArrivingGuests.map((guest, index) => (
                              <TableRow key={guest.id}>
                                <TableCell className="font-medium">
                                  <input
                                    type="checkbox"
                                    checked={selectedGuests.has(guest.id)}
                                    onChange={() => toggleGuestSelection(guest.id)}
                                    className="mr-2"
                                  />
                                  {index + 1}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {guest.profiles?.first_name || 'Unknown'}
                                </TableCell>
                                <TableCell>
                                  {guest.profiles?.last_name || 'Unknown'}
                                </TableCell>
                                <TableCell className="text-sm hidden sm:table-cell">
                                  {guest.profiles?.email || 'No email'}
                                </TableCell>
                                <TableCell className="text-sm hidden md:table-cell">
                                  {guest.profiles?.phone_number || 'No phone'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    {guest.is_approved ? (
                                      <Badge variant="default" className="bg-green-600">Approved</Badge>
                                    ) : (
                                      <Badge variant="secondary">Pending</Badge>
                                    )}
                                    {guest.auto_approved && (
                                      <Badge variant="outline" className="text-xs">Auto</Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {!guest.is_approved && (
                                      <Button
                                        size="sm"
                                        onClick={() => approveQR(guest.id)}
                                        className="p-1"
                                        title="Approve"
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                    )}
                                    {!guest.auto_approved && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => approveAlways(guest.user_id)}
                                        className="p-1"
                                        title="Auto-approve"
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
                                      className="p-1"
                                      title="Send message"
                                    >
                                      <MessageCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => viewSocialMedia(guest.user_id)}
                                      className="p-1"
                                      title="View socials"
                                    >
                                      <Users className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="space-y-3 pt-4 border-t">
                        <Button
                          onClick={sendQRToAll}
                          disabled={arrivingGuests.length === 0}
                          className="w-full"
                        >
                          Send QR to All ({arrivingGuests.length})
                        </Button>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setEmailDialog({
                              open: true,
                              guestId: 'all',
                              email: 'all-guests'
                            })}
                            className="flex-1 text-xs sm:text-sm"
                          >
                            <MessageCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                            <span className="truncate">Message All ({arrivingGuests.length})</span>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={messageSelected}
                            disabled={selectedGuests.size === 0}
                            className="flex-1 text-xs sm:text-sm"
                          >
                            <Users className="h-4 w-4 mr-1 flex-shrink-0" />
                            <span className="truncate">Message Selected ({selectedGuests.size})</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="scanned" className="space-y-4">
                  {loading ? (
                    <p className="text-center text-muted-foreground py-8">Loading guests...</p>
                  ) : scannedGuests.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No checked-in guests yet
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">#</TableHead>
                            <TableHead className="min-w-[100px]">First Name</TableHead>
                            <TableHead className="min-w-[100px]">Last Name</TableHead>
                            <TableHead className="min-w-[200px] hidden sm:table-cell">Email</TableHead>
                            <TableHead className="min-w-[120px] hidden md:table-cell">Phone</TableHead>
                            <TableHead className="min-w-[120px]">Check-in Time</TableHead>
                            <TableHead className="w-16">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {scannedGuests.map((guest, index) => (
                            <TableRow key={guest.id}>
                              <TableCell className="font-medium">{index + 1}</TableCell>
                              <TableCell className="font-medium">
                                {guest.profiles?.first_name || 'Unknown'}
                              </TableCell>
                              <TableCell>
                                {guest.profiles?.last_name || 'Unknown'}
                              </TableCell>
                              <TableCell className="text-sm hidden sm:table-cell">
                                {guest.profiles?.email || 'No email'}
                              </TableCell>
                              <TableCell className="text-sm hidden md:table-cell">
                                {guest.profiles?.phone_number || 'No phone'}
                              </TableCell>
                              <TableCell className="text-sm">
                                {new Date(guest.scanned_at).toLocaleDateString('en-GB', { 
                                  day: 'numeric', 
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
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
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Message Dialog */}
        <Dialog open={emailDialog.open} onOpenChange={(open) => setEmailDialog(prev => ({ ...prev, open }))}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Send Message</DialogTitle>
              <DialogDescription>
                Send a custom message to the selected guest(s).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">To: {
                  emailDialog.guestId === 'all' ? 'All arriving guests' : 
                  emailDialog.guestId === 'selected' ? `${selectedGuests.size} selected guests` : 
                  emailDialog.email
                }</label>
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <textarea
                  className="w-full p-2 border rounded-md h-32 resize-none"
                  placeholder="Enter your message..."
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setEmailDialog({ open: false, guestId: '', email: '' })}>
                Cancel
              </Button>
              <Button onClick={sendMessage} disabled={!emailMessage.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <SocialDialog
          open={socialDialog.open}
          onOpenChange={(open) => setSocialDialog(prev => ({ ...prev, open }))}
          socials={socialDialog.socials}
        />
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default AdminGuestList;