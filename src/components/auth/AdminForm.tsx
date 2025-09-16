import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface AdminFormProps {
  onShowAdminPassword: (email: string, password: string) => void;
  pendingAdminSignup: {email: string, password: string} | null;
}

export const AdminForm = ({ onShowAdminPassword, pendingAdminSignup }: AdminFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleAdminLogin = async () => {
    if (!email || !password) {
      toast({
        title: t('error'),
        description: t('all_fields_required'),
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
          title: t('error'),
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failed_to_sign_in'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdminClick = () => {
    if (!email || !password) {
      toast({
        title: t('error'),
        description: t('enter_email_password_first'),
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
        placeholder={t('admin_email')}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        type="password"
        placeholder={t('password')}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="space-y-2">
        <Button 
          onClick={handleAdminLogin}
          disabled={loading || !email || !password}
          className="w-full"
        >
          {loading ? t('signing_in') : t('sign_in_as_admin')}
        </Button>
        <button 
          onClick={handleCreateAdminClick}
          disabled={!email || !password}
          className="w-full px-4 py-3 rounded font-medium border border-gray-300 hover:bg-gray-50"
          style={{ color: '#000000', backgroundColor: '#ffffff' }}
        >
          {t('create_admin_account')}
        </button>
      </div>
    </div>
  );
};