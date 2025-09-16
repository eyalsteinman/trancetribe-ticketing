import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface ProfileData {
  nickname?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
}

export const useProfileData = (userId?: string) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('nickname, display_name, first_name, last_name, email, phone_number')
        .eq('user_id', userId)
        .single();

      if (data && !error) {
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (error) {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return { profile, loading, refetch: loadProfile };
};