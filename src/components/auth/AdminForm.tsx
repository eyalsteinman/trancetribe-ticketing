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
      <div>
        <label className="text-sm font-medium text-white block mb-2">{t('admin_email')} *</label>
        <Input
          type="email"
          placeholder={t('enter_email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input rounded-xl h-12 px-4 text-white placeholder:text-white/60"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-white block mb-2">{t('password')} *</label>
        <Input
          type="password"
          placeholder={t('enter_password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input rounded-xl h-12 px-4 text-white placeholder:text-white/60"
        />
      </div>
      <div className="space-y-3">
        <Button 
          onClick={handleAdminLogin}
          disabled={loading || !email || !password}
          className="w-full auth-button rounded-xl h-12 font-semibold text-base"
        >
          {loading ? t('signing_in') : t('sign_in_as_admin')}
        </Button>
        <button 
          onClick={handleCreateAdminClick}
          disabled={!email || !password}
          className="w-full auth-button rounded-xl h-12 font-semibold text-base"
        >
          {t('create_admin_account')}
        </button>

        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-white/20"></div>
          <span className="px-4 text-white/60 text-sm">{t('or_continue_with')}</span>
          <div className="flex-1 h-px bg-white/20"></div>
        </div>

        <div className="flex gap-3">
          <Button 
            type="button"
            variant="outline"
            className="flex-1 auth-button rounded-xl h-12 font-semibold text-base"
            onClick={() => {
              // Add Google OAuth for admin
            }}
          >
            {t('google')}
          </Button>
          <Button 
            type="button"
            variant="outline"
            className="flex-1 auth-button rounded-xl h-12 font-semibold text-base"
            onClick={() => {
              // Add Facebook OAuth for admin
            }}
          >
            {t('facebook')}
          </Button>
        </div>
      </div>
    </div>
  );
};