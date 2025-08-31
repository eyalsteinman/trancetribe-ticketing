import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Check, UserCheck, Mail, MessageCircle } from 'lucide-react';
import { useBackground } from '@/contexts/BackgroundContext';
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
  const [activeTab, setActiveTab] = useState<'scanned' | 'arriving'>('scanned');
  const [arrivingGuests, setArrivingGuests] = useState<ArrivingGuest[]>([]);
  const [scannedGuests, setScannedGuests] = useState<ScannedGuest[]>([]);
  const [loading, setLoading] = useState(false);
  const [emailDialog, setEmailDialog] = useState<{open: boolean; guestId: string; email: string}>({
    open: false,
    guestId: '',
    email: ''
  });
  const [emailMessage, setEmailMessage] = useState('');
  
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

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

      // Send QR code email to the user
      const guest = arrivingGuests.find(g => g.id === qrId);
      if (guest && guest.profiles?.email) {
        try {
          await supabase.functions.invoke('send-qr-code-email', {
            body: {
              to: guest.profiles.email,
              qrCode: guest.code,
              partyName: parties.find(p => p.id === selectedParty)?.name || 'Your Party',
              userName: guest.profiles.first_name,
              partyDate: parties.find(p => p.id === selectedParty)?.date
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

  const sendEmail = async () => {
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
        const emails = emailDialog.email.split(', ');
        const promises = emails.map(email => 
          supabase.functions.invoke('send-guest-message', {
            body: {
              to: email,
              message: emailMessage,
              subject: `Message about your party registration`,
              partyName: parties.find(p => p.id === selectedParty)?.name
            }
          })
        );
        
        await Promise.all(promises);
        
        toast({
          title: "Success",
          description: `Message sent to ${emails.length} guests successfully`,
        });
      } else {
        // Send to single guest
        const { data, error } = await supabase.functions.invoke('send-guest-message', {
          body: {
            to: emailDialog.email,
            message: emailMessage,
            subject: `Message about your party registration`,
            partyName: parties.find(p => p.id === selectedParty)?.name
          }
        });

        if (error) {
          throw error;
        }

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

  const createWhatsAppGroup = async () => {
    if (!selectedParty) return;
    
    const phoneNumbers = arrivingGuests
      .filter(guest => guest.profiles?.phone_number)
      .map(guest => guest.profiles!.phone_number);
    
    if (phoneNumbers.length === 0) {
      toast({
        title: "Error",
        description: "No phone numbers found for arriving guests",
        variant: "destructive"
      });
      return;
    }

    try {
      const party = parties.find(p => p.id === selectedParty);
      if (!party) return;

      const { data, error } = await supabase.functions.invoke('create-whatsapp-group', {
        body: {
          partyName: party.name,
          partyDate: party.date,
          productionName: party.production_name || 'Party',
          phoneNumbers
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `WhatsApp group created with ${phoneNumbers.length} guests`,
      });
    } catch (error: any) {
      console.error('Error creating WhatsApp group:', error);
      toast({
        title: "Error",
        description: "Failed to create WhatsApp group. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div 
      className="min-h-screen p-4 transition-colors duration-500"
      style={{ 
        backgroundColor
      }}
    >
      <div className="max-w-4xl mx-auto space-y-6 text-left">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack} aria-label="Back" className="absolute top-4 right-4 z-[9999] on-color back-button">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 
            className="text-xl font-bold"
            style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
          >
            Guest List
          </h1>
        </div>

        {/* Party Selection */}
        {parties.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Party</CardTitle>
            </CardHeader>
            <CardContent>
              <select 
                className="w-full p-2 border rounded-md text-black"
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
          >
            Scanned ({scannedGuests.length})
          </Button>
          <Button
            variant={activeTab === 'arriving' ? 'default' : 'outline'}
            onClick={() => setActiveTab('arriving')}
          >
            Arriving ({arrivingGuests.length})
          </Button>
        </div>

        {/* Guest Tables */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {activeTab === 'scanned' ? 'Scanned Guests' : 'Arriving Guests'}
              </CardTitle>
              <div className="flex items-center gap-2">
                {activeTab === 'arriving' && arrivingGuests.length > 0 && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={createWhatsAppGroup}
                      className="flex items-center gap-1"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Create WhatsApp Group
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const emails = arrivingGuests
                          .filter(guest => guest.profiles?.email)
                          .map(guest => guest.profiles!.email)
                          .join(', ');
                        setEmailDialog({ open: true, guestId: 'all', email: emails });
                      }}
                      className="flex items-center gap-1"
                    >
                      <Mail className="h-4 w-4" />
                      Email All
                    </Button>
                  </>
                )}
                <Badge variant="secondary">
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
                      <TableHead className="text-black">Scanned At</TableHead>
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
                          {new Date(guest.scanned_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-black">#</TableHead>
                      <TableHead className="text-black">First Name</TableHead>
                      <TableHead className="text-black">Last Name</TableHead>
                      <TableHead className="text-black">Email</TableHead>
                      <TableHead className="text-black">Status</TableHead>
                      <TableHead className="text-black">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {arrivingGuests.map((guest, index) => (
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
                                className="p-1"
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
                              className="p-1"
                              title="Send message"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            )}
            
            {/* Email All Arriving and WhatsApp Actions - Only show for arriving tab */}
            {activeTab === 'arriving' && arrivingGuests.length > 0 && (
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    const emails = arrivingGuests
                      .filter(guest => guest.profiles?.email)
                      .map(guest => guest.profiles!.email)
                      .join(', ');
                    setEmailDialog({
                      open: true,
                      guestId: 'all',
                      email: emails
                    });
                  }}
                  className="flex-1"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email All ({arrivingGuests.filter(g => g.profiles?.email).length})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "WhatsApp Feature",
                      description: "WhatsApp messaging requires phone numbers to be collected first. This feature will be available once phone numbers are added to user profiles.",
                      variant: "default"
                    });
                  }}
                  className="flex-1"
                >
                  WhatsApp All
                </Button>
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
                <label className="text-sm font-medium text-black">To: {emailDialog.email}</label>
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
              <Button onClick={sendEmail}>Send Message</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminGuestList;