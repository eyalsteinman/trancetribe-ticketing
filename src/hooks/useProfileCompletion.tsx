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
      
      // Add timeout to prevent hanging
      const userPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );
      
      const { data: { user }, error: userError } = await Promise.race([
        userPromise, 
        timeoutPromise
      ]) as any;
      
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
      
      // Use maybeSingle() instead of single() to handle cases where no profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone_number, email')
        .eq('user_id', user.id)
        .maybeSingle();

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
      // If it's a timeout or network error, assume no user and allow app to continue
      if (error.message === 'Timeout') {
        console.log('⏰ Timeout occurred, assuming no user');
      }
      setIsProfileComplete(false);
    } finally {
      console.log('🏁 Profile completion check finished');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Add a fallback timeout to prevent infinite loading
    const fallbackTimeout = setTimeout(() => {
      console.log('⚠️ Fallback timeout triggered - forcing loading to false');
      setLoading(false);
      setIsProfileComplete(false);
    }, 15000);

    checkProfileCompletion().finally(() => {
      clearTimeout(fallbackTimeout);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkProfileCompletion();
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallbackTimeout);
    };
  }, []);

  return {
    isProfileComplete,
    loading,
    refetchProfile: checkProfileCompletion
  };
};