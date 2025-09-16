import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useProfileCompletion = () => {
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkProfileCompletion = async () => {
    console.log('🔍 Starting profile completion check...');
    setLoading(true);
    
    try {
      console.log('📡 Getting user from Supabase...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ Error getting user:', userError);
        setIsProfileComplete(false);
        setLoading(false);
        return;
      }
      
      if (!user) {
        console.log('👤 No user found, setting profile incomplete');
        setIsProfileComplete(false);
        setLoading(false);
        return;
      }

      console.log('✅ User found:', user.id);
      console.log('📊 Fetching user profile...');
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone_number, email')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Error fetching profile:', profileError);
        setIsProfileComplete(false);
        setLoading(false);
        return;
      }

      console.log('📋 Profile data:', profile);

      if (profile) {
        const isComplete = !!(
          profile.first_name && 
          profile.last_name && 
          profile.phone_number && 
          profile.email
        );
        console.log('✅ Profile completion status:', isComplete);
        setIsProfileComplete(isComplete);
      } else {
        console.log('❌ No profile found, setting incomplete');
        setIsProfileComplete(false);
      }
    } catch (error) {
      console.error('💥 Catch error in profile completion check:', error);
      setIsProfileComplete(false);
    } finally {
      console.log('🏁 Profile completion check finished');
      setLoading(false);
    }
  };

  useEffect(() => {
    checkProfileCompletion();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkProfileCompletion();
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    isProfileComplete,
    loading,
    refetchProfile: checkProfileCompletion
  };
};