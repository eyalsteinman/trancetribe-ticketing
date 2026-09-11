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
      const { data, error } = await supabase.functions.invoke('verify-admin-password', {
        body: {
          email: pendingAdminSignup.email,
          password: pendingAdminSignup.password,
          uniquePassword: password,
        },
      });

      if (error || (data as any)?.error) {
        toast({
          title: "Access Denied",
          description: (data as any)?.error || "Invalid or expired admin password",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Success",
        description: "Admin account created successfully! You can now sign in.",
      });

      onSuccess();
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