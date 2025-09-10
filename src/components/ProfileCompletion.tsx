import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import RtlText from './RtlText';

interface ProfileCompletionProps {
  onProfileComplete: () => void;
}

const ProfileCompletion = ({ onProfileComplete }: ProfileCompletionProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    // Load existing profile data
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setFirstName(profile.first_name || '');
          setLastName(profile.last_name || '');
          setPhoneNumber(profile.phone_number || '');
          setEmail(profile.email || user.email || '');
        }
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async () => {
    if (!firstName || !lastName || !phoneNumber || !email) {
      toast({
        title: t('error'),
        description: t('please_fill_all_fields'),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          email: email,
          display_name: `${firstName} ${lastName}`
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: t('success'),
        description: t('profile_updated_successfully')
      });

      onProfileComplete();
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            <RtlText text={t('complete_your_profile')} />
          </CardTitle>
          <p className="text-center text-muted-foreground">
            <RtlText text={t('profile_completion_required')} />
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">
                <RtlText text={t('first_name')} />
              </Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t('first_name')}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">
                <RtlText text={t('last_name')} />
              </Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t('last_name')}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">
              <RtlText text={t('email')} />
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('email')}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="phoneNumber">
              <RtlText text={t('phone_number')} />
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={t('phone_number')}
              required
            />
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={loading || !firstName || !lastName || !phoneNumber || !email}
            className="w-full"
          >
            {loading ? t('updating') : t('complete_profile')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileCompletion;