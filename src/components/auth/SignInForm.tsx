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

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
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
        description: t('google_signin_failed'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/`
        }
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
        description: t('facebook_signin_failed'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInstagramLogin = async () => {
    toast({
      title: "Instagram Login",
      description: "Instagram login will be available soon",
    });
  };

  const handleTikTokLogin = async () => {
    toast({
      title: "TikTok Login", 
      description: "TikTok login will be available soon",
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-white block mb-2">{t('email')} *</label>
        <RtlInput
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('enter_email')}
          required
          className="auth-input rounded-lg h-12 px-4 text-black placeholder:text-white/60"
        />
      </div>
      
      <div>
        <label className="text-sm font-medium text-white block mb-2">{t('password')} *</label>
        <RtlInput
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('enter_password')}
          required
          className="auth-input rounded-lg h-12 px-4 text-black placeholder:text-white/60"
        />
      </div>

      <Button 
        onClick={handleSignIn}
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg h-12 font-semibold text-base transition-all duration-300"
      >
        {loading ? t('processing') : t('sign_in')}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/30" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-transparent px-3 text-white/80">
            {t('or_continue_with')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 rtl-grid">
        <Button 
          type="button"
          variant="outline"
          className="bg-transparent border-white/30 text-white rounded-lg h-12 font-semibold text-base hover:bg-white/10"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {t('google')}
        </Button>
        <Button 
          type="button"
          variant="outline"
          className="bg-transparent border-white/30 text-white rounded-lg h-12 font-semibold text-base hover:bg-white/10"
          onClick={handleFacebookLogin}
          disabled={loading}
        >
          {t('facebook')}
        </Button>
        <Button 
          type="button"
          variant="outline"
          className="bg-transparent border-white/30 text-white rounded-lg h-12 font-semibold text-base hover:bg-white/10"
          onClick={handleInstagramLogin}
          disabled={loading}
        >
          Instagram
        </Button>
        <Button 
          type="button"
          variant="outline"
          className="bg-transparent border-white/30 text-white rounded-lg h-12 font-semibold text-base hover:bg-white/10"
          onClick={handleTikTokLogin}
          disabled={loading}
        >
          TikTok
        </Button>
      </div>
    </div>
  );
};