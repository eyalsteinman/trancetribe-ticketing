import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminFormProps {
  onShowAdminPassword: (email: string, password: string) => void;
  pendingAdminSignup: {email: string, password: string} | null;
}

export const AdminForm = ({ onShowAdminPassword, pendingAdminSignup }: AdminFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAdminLogin = async () => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdminClick = () => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter email and password first",
        variant: "destructive"
      });
      return;
    }
    onShowAdminPassword(email, password);
  };

  return (
    <div className="space-y-4">
      <Input
        type="email"
        placeholder="Admin email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="space-y-2">
        <Button 
          onClick={handleAdminLogin}
          disabled={loading || !email || !password}
          className="w-full"
        >
          {loading ? "Signing in..." : "Sign In as Admin"}
        </Button>
        <button 
          onClick={handleCreateAdminClick}
          disabled={!email || !password}
          className="w-full px-4 py-3 rounded font-medium border border-gray-300 hover:bg-gray-50"
          style={{ color: '#000000', backgroundColor: '#ffffff' }}
        >
          Create Admin Account
        </button>
      </div>
    </div>
  );
};