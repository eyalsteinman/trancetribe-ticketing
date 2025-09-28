import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface SignUpFormProps {}

export const SignUpForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [facebookProfile, setFacebookProfile] = useState('');
  const [instagramProfile, setInstagramProfile] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const validateSocialUrl = (url: string, platform: 'facebook' | 'instagram'): boolean => {
    if (!url) return true; // Empty is okay since it's optional
    
    const patterns = {
      facebook: /^https?:\/\/(www\.)?(facebook\.com|fb\.com)\/.+/i,
      instagram: /^https?:\/\/(www\.)?instagram\.com\/.+/i
    };
    
    return patterns[platform].test(url);
  };

  const handleSignUp = async () => {
    if (!email || !password || !firstName || !lastName || !phoneNumber) {
      toast({
        title: t('error'),
        description: t('phone_required'),
        variant: "destructive"
      });
      return;
    }

    // Check if social networks are filled - show popup if not
    if (!facebookProfile && !instagramProfile) {
      toast({
        title: "Social Networks",
        description: "You didn't fill in social networks profiles, you can't buy tickets for events if you don't. You can do this now or later in the social networks tab"
      });
    }

    // Validate social network URLs if provided
    if (facebookProfile && !validateSocialUrl(facebookProfile, 'facebook')) {
      toast({
        title: t('error'),
        description: t('invalid_facebook_url'),
        variant: "destructive"
      });
      return;
    }

    if (instagramProfile && !validateSocialUrl(instagramProfile, 'instagram')) {
      toast({
        title: t('error'),
        description: t('invalid_instagram_url'),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: firstName,
              last_name: lastName,
              phone_number: phoneNumber,
              facebook_profile: facebookProfile,
              instagram_profile: instagramProfile,
              display_name: `${firstName} ${lastName}`
            }
        }
      });
      
      if (error) throw error;
      
        toast({
          title: t('success'),
          description: t('account_created_verify_email')
        });
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-white block mb-2">{t('first_name')} *</label>
          <Input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t('enter_first_name')}
            required
            className="auth-input rounded-xl h-12 px-4 text-black placeholder:text-white/60 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-white block mb-2">{t('last_name')} *</label>
          <Input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={t('enter_last_name')}
            required
            className="auth-input rounded-xl h-12 px-4 text-black placeholder:text-white/60 text-sm"
          />
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium text-white block mb-2">{t('phone_number')} *</label>
        <Input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder={t('enter_phone_number')}
          required
          className="auth-input rounded-xl h-12 px-4 text-black placeholder:text-white/60"
        />
      </div>
      
      <div>
        <label className="text-sm font-medium text-white block mb-2">{t('facebook_profile')}</label>
        <Input
          type="url"
          value={facebookProfile}
          onChange={(e) => setFacebookProfile(e.target.value)}
          placeholder="facebook.com/profile"
          className="auth-input rounded-xl h-12 px-4 text-black placeholder:text-white/60"
        />
        <p className="text-xs text-white/60 mt-1">{t('can_do_later')}</p>
      </div>
      
      <div>
        <label className="text-sm font-medium text-white block mb-2">{t('instagram_profile')}</label>
        <Input
          type="url"
          value={instagramProfile}
          onChange={(e) => setInstagramProfile(e.target.value)}
          placeholder="instagram.com/profile"
          className="auth-input rounded-xl h-12 px-4 text-black placeholder:text-white/60"
        />
        <p className="text-xs text-white/60 mt-1">{t('can_do_later')}</p>
      </div>
      
      <div>
        <label className="text-sm font-medium text-white block mb-2">{t('email')} *</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('enter_email')}
          required
          className="auth-input rounded-xl h-12 px-4 text-black placeholder:text-white/60"
        />
      </div>
      
      <div>
        <label className="text-sm font-medium text-white block mb-2">{t('password')} *</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('enter_password')}
          required
          className="auth-input rounded-xl h-12 px-4 text-black placeholder:text-white/60"
        />
      </div>

      <Button 
        onClick={handleSignUp}
        disabled={loading}
        className="w-full bg-purple-600 text-white rounded-xl h-12 font-semibold text-base hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? t('processing') : t('create_account')}
      </Button>

      <div className="flex items-center my-4">
        <div className="flex-1 h-px bg-white/20"></div>
        <span className="px-4 text-white/60 text-sm">{t('or_continue_with')}</span>
        <div className="flex-1 h-px bg-white/20"></div>
      </div>

      <div className="flex gap-3">
        <Button 
          type="button"
          variant="outline"
          className="flex-1 bg-transparent border-white/30 text-white rounded-xl h-12 font-semibold text-base hover:bg-white/10"
          onClick={() => {
            toast({
              title: t('info'),
              description: t('google_signin_failed'),
              variant: "default"
            });
          }}
        >
          {t('google')}
        </Button>
        <Button 
          type="button"
          variant="outline"
          className="flex-1 bg-transparent border-white/30 text-white rounded-xl h-12 font-semibold text-base hover:bg-white/10"
          onClick={() => {
            toast({
              title: t('info'),
              description: t('facebook_signin_failed'),
              variant: "default"
            });
          }}
        >
          {t('facebook')}
        </Button>
      </div>
    </div>
  );
};