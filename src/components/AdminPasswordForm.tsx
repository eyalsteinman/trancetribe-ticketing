import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AdminPasswordFormProps {
  onSuccess: () => void;
  onBack: () => void;
  pendingAdminSignup: {email: string, password: string} | null;
}

const AdminPasswordForm = ({ onSuccess, onBack, pendingAdminSignup }: AdminPasswordFormProps) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!pendingAdminSignup) {
      toast({
        title: "Error",
        description: "No pending admin signup",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Check if the password is valid and not used
      const { data: passwordData, error: passwordError } = await supabase
        .from('admin_passwords')
        .select('*')
        .eq('admin_email', pendingAdminSignup.email)
        .eq('unique_password', password)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (passwordError || !passwordData) {
        toast({
          title: "Access Denied",
          description: "Invalid or expired admin password",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const allowedTiles = (passwordData as any).allowed_tiles || [];

      // Create the admin account
      const { data, error } = await supabase.auth.signUp({
        email: pendingAdminSignup.email,
        password: pendingAdminSignup.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: '',
            last_name: '',
            display_name: pendingAdminSignup.email.split('@')[0]
          }
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      if (data.user) {
        // Mark password as used
        await supabase
          .from('admin_passwords')
          .update({ is_used: true })
          .eq('id', passwordData.id);

        // Add admin role and profile
        await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: 'admin'
          });

        await supabase
          .from('admin_profiles')
          .insert({
            user_id: data.user.id,
            admin_level: 'level1',
            created_by: passwordData.created_by,
            allowed_tiles: allowedTiles
          });

        toast({
          title: "Success",
          description: "Admin account created successfully! Please check your email to confirm your account.",
        });

        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create admin account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Admin Verification</CardTitle>
            <CardDescription>Contact Trance Tribes Ticketing Management for your unique entry password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter your unique admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <div className="space-y-2">
              <Button 
                onClick={handleSubmit}
                disabled={loading || !password}
                className="w-full"
              >
                {loading ? "Creating Account..." : "Create Admin Account"}
              </Button>
              <Button 
                onClick={onBack}
                variant="outline"
                className="w-full"
              >
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPasswordForm;