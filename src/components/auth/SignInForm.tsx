import { useState } from 'react';
import { Button } from '@/components/ui/button';
import RtlInput from '@/components/RtlInput';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface SignInFormProps {}

export const SignInForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({
        title: t('error'),
        description: t('fields_required'),
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
      
      if (error) throw error;
      
      // Successfully signed in - the app will handle the redirect
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const socialProviders: { id: Provider; label: string }[] = [
    { id: 'google', label: 'Google' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'apple', label: 'Apple' },
    { id: 'twitter', label: 'X (Twitter)' },
    { id: 'discord', label: 'Discord' },
    { id: 'linkedin_oidc', label: 'LinkedIn' },
    { id: 'azure', label: 'Microsoft' },
    { id: 'spotify', label: 'Spotify' },
  ];

  const handleSocialLogin = async (provider: Provider, label: string) => {
    setPendingProvider(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        const notEnabled = /not enabled|unsupported provider/i.test(error.message);
        toast({
          title: label,
          description: notEnabled
            ? `${label} sign-in is not switched on yet for this app.`
            : error.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: label,
        description: error?.message ?? t('error'),
        variant: 'destructive',
      });
    } finally {
      setPendingProvider(null);
    }
  };


  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">{t('email')} *</label>
        <RtlInput
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('enter_email')}
          required
          className="auth-input rounded-lg h-12 px-4 text-foreground placeholder:text-muted-foreground"
        />
      </div>
      
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">{t('password')} *</label>
        <RtlInput
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('enter_password')}
          required
          className="auth-input rounded-lg h-12 px-4 text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <Button 
        onClick={handleSignIn}
        disabled={loading}
        className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary hover:to-primary-glow text-foreground rounded-lg h-12 font-semibold text-base transition-all duration-300"
      >
        {loading ? t('processing') : t('sign_in')}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-transparent px-3 text-muted-foreground">
            {t('or_continue_with')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 rtl-grid">
        <Button 
          type="button"
          variant="outline"
          className="bg-transparent border-border text-foreground rounded-lg h-12 font-semibold text-base hover:bg-surface-2/60"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {t('google')}
        </Button>
        <Button 
          type="button"
          variant="outline"
          className="bg-transparent border-border text-foreground rounded-lg h-12 font-semibold text-base hover:bg-surface-2/60"
          onClick={handleFacebookLogin}
          disabled={loading}
        >
          {t('facebook')}
        </Button>
        <Button 
          type="button"
          variant="outline"
          className="bg-transparent border-border text-foreground rounded-lg h-12 font-semibold text-base hover:bg-surface-2/60"
          onClick={handleInstagramLogin}
          disabled={loading}
        >
          Instagram
        </Button>
        <Button 
          type="button"
          variant="outline"
          className="bg-transparent border-border text-foreground rounded-lg h-12 font-semibold text-base hover:bg-surface-2/60"
          onClick={handleTikTokLogin}
          disabled={loading}
        >
          TikTok
        </Button>
      </div>
    </div>
  );
};