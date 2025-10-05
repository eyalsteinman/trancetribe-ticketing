import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useProfileCompletion = () => {
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkProfileCompletion = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsProfileComplete(false);
        setLoading(false);
        return;
      }

      // Check if user is admin - admins can skip profile completion
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      // Admins don't need complete profiles
      if (adminRole) {
        setIsProfileComplete(true);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone_number, email')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        const isComplete = !!(
          profile.first_name && 
          profile.last_name && 
          profile.phone_number && 
          profile.email
        );
        setIsProfileComplete(isComplete);
      } else {
        setIsProfileComplete(false);
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
      setIsProfileComplete(false);
    } finally {
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