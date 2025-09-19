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
    if (!email || !password || !firstName || !lastName) {
      toast({
        title: t('error'),
        description: t('fields_required'),
        variant: "destructive"
      });
      return;
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
            className="auth-input rounded-xl h-12 px-4 text-white placeholder:text-white/60 text-sm"
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
            className="auth-input rounded-xl h-12 px-4 text-white placeholder:text-white/60 text-sm"
          />
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium text-white block mb-2">{t('phone_number')}</label>
        <Input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder={t('enter_phone_number')}
          className="auth-input rounded-xl h-12 px-4 text-white placeholder:text-white/60"
        />
      </div>
      
      <div>
        <label className="text-sm font-medium text-white block mb-2">{t('facebook_profile')}</label>
        <Input
          type="url"
          value={facebookProfile}
          onChange={(e) => setFacebookProfile(e.target.value)}
          placeholder="facebook.com/profile"
          className="auth-input rounded-xl h-12 px-4 text-white placeholder:text-white/60"
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
          className="auth-input rounded-xl h-12 px-4 text-white placeholder:text-white/60"
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
          className="auth-input rounded-xl h-12 px-4 text-white placeholder:text-white/60"
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
          className="auth-input rounded-xl h-12 px-4 text-white placeholder:text-white/60"
        />
      </div>

      <Button 
        onClick={handleSignUp}
        disabled={loading}
        className="w-full auth-button rounded-xl h-12 font-semibold text-base"
      >
        {loading ? t('processing') : t('create_account')}
      </Button>
    </div>
  );
};