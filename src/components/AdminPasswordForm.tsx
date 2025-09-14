import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AdminPasswordFormProps {
  onSuccess: () => void;
  onBack: () => void;
}

const AdminPasswordForm = ({ onSuccess, onBack }: AdminPasswordFormProps) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Sign in with the provided credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@trancetribe.com', // Use a fixed admin email
        password: password,
      });

      if (error) {
        toast({
          title: "Access Denied",
          description: "Invalid admin credentials",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Check if user has admin role
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'admin');

      if (roleError || !userRoles || userRoles.length === 0) {
        await supabase.auth.signOut(); // Sign out if not admin
        toast({
          title: "Access Denied",
          description: "Admin privileges required",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Authentication failed",
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
            <CardDescription>Please enter the admin password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Admin password"
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
                {loading ? "Verifying..." : "Verify"}
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