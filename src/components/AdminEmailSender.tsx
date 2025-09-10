import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from './ui/page-header';
import { Mail, Send, Users } from 'lucide-react';

interface AdminEmailSenderProps {
  onBack: () => void;
  adminEmail: string;
  adminName?: string;
}

interface User {
  id: string;
  email: string;
  display_name: string;
}

const AdminEmailSender: React.FC<AdminEmailSenderProps> = ({ onBack, adminEmail, adminName }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [customEmail, setCustomEmail] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, display_name')
        .not('email', 'is', null)
        .order('display_name');

      if (error) throw error;

      const formattedUsers = data.map(user => ({
        id: user.user_id,
        email: user.email,
        display_name: user.display_name || user.email
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    const recipientEmail = selectedUser ? users.find(u => u.id === selectedUser)?.email : customEmail;
    
    if (!recipientEmail || !subject || !message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSending(true);

    try {
      const response = await supabase.functions.invoke('send-admin-email', {
        body: {
          to: recipientEmail,
          subject: subject,
          message: message,
          fromEmail: adminEmail,
          fromName: adminName || 'Admin'
        }
      });

      if (response.error) {
        throw response.error;
      }

      toast.success('Email sent successfully!');
      
      // Clear form
      setSelectedUser('');
      setCustomEmail('');
      setSubject('');
      setMessage('');
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(`Failed to send email: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="w-full">
        <PageHeader
          title="Send Email to Users"
          onBack={onBack}
          showBackButton={true}
        />
        
        <div className="container-section pt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Compose Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* From Section */}
              <div className="space-y-2">
                <Label htmlFor="from">From</Label>
                <Input 
                  id="from"
                  value={`${adminName || 'Admin'} <${adminEmail}>`} 
                  disabled 
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Recipients will see this as the sender and can reply to {adminEmail}
                </p>
              </div>

              {/* Recipient Selection */}
              <div className="space-y-4">
                <Label>To</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-normal">Select User</Label>
                    <Select 
                      value={selectedUser} 
                      onValueChange={(value) => {
                        setSelectedUser(value);
                        setCustomEmail('');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a user..." />
                      </SelectTrigger>
                      <SelectContent>
                        {loading ? (
                          <SelectItem value="loading" disabled>Loading users...</SelectItem>
                        ) : (
                          users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                {user.display_name} ({user.email})
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-normal">Or Enter Email</Label>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      value={customEmail}
                      onChange={(e) => {
                        setCustomEmail(e.target.value);
                        setSelectedUser('');
                      }}
                      disabled={!!selectedUser}
                    />
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Enter email subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
              </div>

              {/* Send Button */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onBack}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendEmail} 
                  disabled={isSending}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isSending ? 'Sending...' : 'Send Email'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminEmailSender;