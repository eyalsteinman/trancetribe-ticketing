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
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSignUp = async () => {
    if (!email || !password || !firstName || !lastName) {
      toast({
        title: t('error'),
        description: t('fields_required'),
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-black">{t('first_name')} *</label>
          <Input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t('enter_first_name')}
            required
            className="bg-white text-black border-gray-300"
            style={{ color: '#000000', backgroundColor: '#ffffff' }}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-black">{t('last_name')} *</label>
          <Input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={t('enter_last_name')}
            required
            className="bg-white text-black border-gray-300"
            style={{ color: '#000000', backgroundColor: '#ffffff' }}
          />
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium text-black">{t('phone_number')}</label>
        <Input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder={t('enter_phone_number')}
          className="bg-white text-black border-gray-300"
          style={{ color: '#000000', backgroundColor: '#ffffff' }}
        />
      </div>
      
      <div>
        <label className="text-sm font-medium text-black">{t('email')} *</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('enter_email')}
          required
          className="bg-white text-black border-gray-300"
          style={{ color: '#000000', backgroundColor: '#ffffff' }}
        />
      </div>
      
      <div>
        <label className="text-sm font-medium text-black">{t('password')} *</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('enter_password')}
          required
          className="bg-white text-black border-gray-300"
          style={{ color: '#000000', backgroundColor: '#ffffff' }}
        />
      </div>

      <Button 
        onClick={handleSignUp}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
      >
        {loading ? t('processing') : t('create_account')}
      </Button>
    </div>
  );
};