import { useState } from 'react';
import { Button } from '@/components/ui/button';
import RtlInput from '@/components/RtlInput';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { z } from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Validation schema
const signUpSchema = z.object({
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string()
    .trim()
    .min(1, 'First name is required')
    .max(50, 'First name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in first name'),
  lastName: z.string()
    .trim()
    .min(1, 'Last name is required')
    .max(50, 'Last name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in last name'),
  phoneNumber: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (use international format)'),
  facebookProfile: z.string().url('Invalid Facebook URL').optional().or(z.literal('')),
  instagramProfile: z.string().url('Invalid Instagram URL').optional().or(z.literal(''))
});

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
  const [showSocialWarning, setShowSocialWarning] = useState(false);
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
    // Validate all inputs using Zod
    try {
      signUpSchema.parse({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        facebookProfile: facebookProfile.trim(),
        instagramProfile: instagramProfile.trim()
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.issues[0];
        toast({
          title: t('error'),
          description: firstError.message,
          variant: "destructive"
        });
        return;
      }
    }

    // Check if social networks are filled - show warning dialog if not
    if (!facebookProfile && !instagramProfile) {
      setShowSocialWarning(true);
      return;
    }

    await proceedWithSignUp();
  };

  const proceedWithSignUp = async () => {
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
    <>
      <AlertDialog open={showSocialWarning} onOpenChange={setShowSocialWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('social_media_required')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('cant_buy_tickets_without_socials')}
              <br /><br />
              {t('can_do_later_question')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('go_back')}</AlertDialogCancel>
            <AlertDialogAction onClick={proceedWithSignUp}>
              {t('continue_anyway')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 rtl-grid">
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">{t('first_name')} *</label>
          <RtlInput
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t('enter_first_name')}
            required
            className="auth-input rounded-xl h-12 px-4 text-foreground placeholder:text-muted-foreground text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">{t('last_name')} *</label>
          <RtlInput
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={t('enter_last_name')}
            required
            className="auth-input rounded-xl h-12 px-4 text-foreground placeholder:text-muted-foreground text-sm"
          />
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">{t('phone_number')} *</label>
        <RtlInput
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder={t('enter_phone_number')}
          required
          className="auth-input rounded-xl h-12 px-4 text-foreground placeholder:text-muted-foreground"
        />
      </div>
      
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">{t('facebook_profile')}</label>
        <RtlInput
          type="url"
          value={facebookProfile}
          onChange={(e) => setFacebookProfile(e.target.value)}
          placeholder="facebook.com/profile"
          className="auth-input rounded-xl h-12 px-4 text-foreground placeholder:text-muted-foreground"
        />
        <p className="text-xs text-muted-foreground mt-1">{t('can_do_later')}</p>
      </div>
      
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">{t('instagram_profile')}</label>
        <RtlInput
          type="url"
          value={instagramProfile}
          onChange={(e) => setInstagramProfile(e.target.value)}
          placeholder="instagram.com/profile"
          className="auth-input rounded-xl h-12 px-4 text-foreground placeholder:text-muted-foreground"
        />
        <p className="text-xs text-muted-foreground mt-1">{t('can_do_later')}</p>
      </div>
      
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">{t('email')} *</label>
        <RtlInput
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('enter_email')}
          required
          className="auth-input rounded-xl h-12 px-4 text-foreground placeholder:text-muted-foreground"
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
          className="auth-input rounded-xl h-12 px-4 text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <Button 
        onClick={handleSignUp}
        disabled={loading}
        className="w-full bg-primary text-foreground rounded-xl h-12 font-semibold text-base hover:bg-primary disabled:opacity-50"
      >
        {loading ? t('processing') : t('create_account')}
      </Button>

      <div className="flex items-center my-4">
        <div className="flex-1 h-px bg-surface-2/60"></div>
        <span className="px-4 text-muted-foreground text-sm">{t('or_continue_with')}</span>
        <div className="flex-1 h-px bg-surface-2/60"></div>
      </div>

      <div className="grid grid-cols-2 gap-3 rtl-grid">
        <Button 
          type="button"
          variant="outline"
          className="bg-transparent border-border text-foreground rounded-xl h-12 font-semibold text-base hover:bg-surface-2/60"
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
          className="bg-transparent border-border text-foreground rounded-xl h-12 font-semibold text-base hover:bg-surface-2/60"
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
        <Button 
          type="button"
          variant="outline"
          className="bg-transparent border-border text-foreground rounded-xl h-12 font-semibold text-base hover:bg-surface-2/60"
          onClick={() => {
            toast({
              title: "Instagram",
              description: "Instagram login will be available soon",
            });
          }}
        >
          Instagram
        </Button>
        <Button 
          type="button"
          variant="outline"
          className="bg-transparent border-border text-foreground rounded-xl h-12 font-semibold text-base hover:bg-surface-2/60"
          onClick={() => {
            toast({
              title: "TikTok",
              description: "TikTok login will be available soon",
            });
          }}
        >
          TikTok
        </Button>
      </div>
    </div>
    </>
  );
};