import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BackButton from '@/components/ui/back-button';

interface User {
  id: string;
  email: string;
  display_name: string;
}

interface Production {
  id: string;
  name: string;
}

interface AdminMessageSenderProps {
  onBack: () => void;
  adminId: string;
  adminName?: string;
}

const AdminMessageSender: React.FC<AdminMessageSenderProps> = ({ 
  onBack, 
  adminId, 
  adminName 
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [productions, setProductions] = useState<Production[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedProduction, setSelectedProduction] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
    loadProductions();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, display_name')
        .order('display_name');

      if (error) throw error;

      const formattedUsers = data.map(user => ({
        id: user.user_id,
        email: user.email || '',
        display_name: user.display_name || user.email || 'Unknown User'
      }));

      setUsers(formattedUsers);
    } catch (error: any) {
      toast({
        title: "Error loading users",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadProductions = async () => {
    try {
      const { data, error } = await supabase
        .from('productions')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setProductions(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading productions",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleUserSelect = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
      setSelectAll(false);
    }
  };

  const handleSendMessage = async () => {
    if (!subject.trim() || !message.trim() || selectedUsers.length === 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields and select at least one recipient.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      const messagesToInsert = selectedUsers.map(userId => ({
        created_by: adminId,
        recipient_id: userId,
        production_id: selectedProduction || null,
        subject: subject.trim(),
        content: message.trim()
      }));

      const { error } = await supabase
        .from('messages')
        .insert(messagesToInsert);

      if (error) throw error;

      toast({
        title: "Messages sent successfully",
        description: `Sent to ${selectedUsers.length} user(s)`,
      });

      // Reset form
      setSubject('');
      setMessage('');
      setSelectedUsers([]);
      setSelectAll(false);
      setSelectedProduction('');
    } catch (error: any) {
      toast({
        title: "Error sending messages",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="app-background min-h-screen">
      {/* Floating particles */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-ping opacity-40"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-accent rounded-full animate-ping opacity-60 delay-1000"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-radial from-accent/30 to-transparent rounded-full blur-3xl animate-float"></div>
      </div>
      
      <div className="relative z-10 p-4 w-full">
        <div className="floating-section">
          <div className="flex items-center justify-between w-full">
            <h1 className="text-2xl font-bold text-foreground">
              Message Users
            </h1>
            <BackButton onBack={onBack} />
        </div>

        <Card className="pt-4">
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                value={adminName || 'Admin'}
                disabled
                className="bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="production">Production (Optional)</Label>
              <Select value={selectedProduction} onValueChange={setSelectedProduction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a production" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Message</SelectItem>
                  {productions.map((production) => (
                    <SelectItem key={production.id} value={production.id}>
                      {production.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Recipients</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="font-medium">
                    <Users className="inline mr-1 h-4 w-4" />
                    Select All Users
                  </Label>
                </div>
                <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={user.id}
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => handleUserSelect(user.id, !!checked)}
                      />
                      <Label htmlFor={user.id} className="text-sm">
                        {user.display_name} ({user.email})
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedUsers.length} user(s)
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter message subject"
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message here..."
                rows={6}
              />
            </div>

            <div className="flex space-x-4">
              <Button variant="outline" onClick={onBack}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendMessage} 
                disabled={sending || selectedUsers.length === 0}
              >
                <Send className="mr-2 h-4 w-4" />
                {sending ? 'Sending...' : `Send Message (${selectedUsers.length})`}
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminMessageSender;