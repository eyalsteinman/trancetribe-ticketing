import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { useBackground } from '@/contexts/BackgroundContext';
import PageHeader from '@/components/ui/page-header';

interface PersonalizeEditProps {
  user: User;
  onBack: () => void;
}

const PersonalizeEdit = ({ user, onBack }: PersonalizeEditProps) => {
  const [nickname, setNickname] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [email, setEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { backgroundColor, isBackgroundDark } = useBackground();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('nickname, email, phone_number')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setNickname(data.nickname || '');
        setNicknameInput(data.nickname || '');
        setEmail(data.email || user.email || '');
        setEmailInput(data.email || user.email || '');
        setPhone(data.phone_number || '');
        setPhoneInput(data.phone_number || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveNickname = async () => {
    if (!nicknameInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a nickname",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nickname: nicknameInput.trim() })
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save nickname",
          variant: "destructive"
        });
      } else {
        setNickname(nicknameInput.trim());
        toast({
          title: "Success",
          description: "Nickname updated successfully!",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save nickname",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveEmail = async () => {
    if (!emailInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Update in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ email: emailInput.trim() })
        .eq('user_id', user.id);

      if (profileError) {
        throw profileError;
      }

      // Update auth email - this will send a confirmation email
      const { error: authError } = await supabase.auth.updateUser({
        email: emailInput.trim()
      });

      if (authError) {
        throw authError;
      }

      setEmail(emailInput.trim());
      toast({
        title: "Success",
        description: "Email update initiated! Check your new email for confirmation.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update email",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const savePhone = async () => {
    if (!phoneInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phone_number: phoneInput.trim() })
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save phone number",
          variant: "destructive"
        });
      } else {
        setPhone(phoneInput.trim());
        toast({
          title: "Success",
          description: "Phone number updated successfully!",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save phone number",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast({
          title: "Success",
          description: "Password changed successfully!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen p-4 transition-colors duration-500"
      style={{ 
        backgroundColor
      }}
    >
      <PageHeader
        title="My Info"
        onBack={onBack}
        isBackgroundDark={isBackgroundDark}
      />
      
      <div className="max-w-md mx-auto pt-20 space-y-6 text-left">

        <div className="space-y-6">
          {/* Nickname Section */}
          <Card>
            <CardHeader>
              <CardTitle>Nickname</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Current: {nickname || 'No nickname set'}</label>
                <Input
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  placeholder="Enter your nickname"
                />
              </div>
              <Button
                onClick={saveNickname}
                disabled={loading || !nicknameInput.trim() || nicknameInput.trim() === nickname}
                className="w-full"
              >
                {loading ? "Saving..." : "Update Nickname"}
              </Button>
            </CardContent>
          </Card>

          {/* Email Section */}
          <Card>
            <CardHeader>
              <CardTitle>Email Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Current: {email}</label>
                <Input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
              <Button
                onClick={saveEmail}
                disabled={loading || !emailInput.trim() || emailInput.trim() === email}
                className="w-full"
              >
                {loading ? "Updating..." : "Update Email"}
              </Button>
            </CardContent>
          </Card>

          {/* Phone Section */}
          <Card>
            <CardHeader>
              <CardTitle>Phone Number</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Current: {phone || 'No phone set'}</label>
                <Input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
              <Button
                onClick={savePhone}
                disabled={loading || !phoneInput.trim() || phoneInput.trim() === phone}
                className="w-full"
              >
                {loading ? "Saving..." : "Update Phone"}
              </Button>
            </CardContent>
          </Card>

          {/* Password Section */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Password</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm New Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              <Button
                onClick={changePassword}
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                className="w-full"
              >
                {loading ? "Changing..." : "Change Password"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PersonalizeEdit;