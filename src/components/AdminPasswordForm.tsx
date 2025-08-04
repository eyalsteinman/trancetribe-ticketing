import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface AdminPasswordFormProps {
  onSuccess: () => void;
  onBack: () => void;
}

const AdminPasswordForm = ({ onSuccess, onBack }: AdminPasswordFormProps) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = () => {
    setLoading(true);
    
    setTimeout(() => {
      if (password === 'trancetribeadmin69') {
        onSuccess();
      } else {
        toast({
          title: "Access Denied",
          description: "you are no admin of mine",
          variant: "destructive"
        });
      }
      setLoading(false);
    }, 500);
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