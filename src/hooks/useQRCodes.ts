import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useQRCodes = (userId?: string) => {
  const [qrCodes, setQRCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQRCodes = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select(`
          *,
          parties (
            name,
            date,
            photo_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (data && !error) {
        // Remove duplicates by party_id - keep only the latest QR code per party
        const uniqueQRCodes = data.reduce((acc: any[], current: any) => {
          const existingIndex = acc.findIndex(qr => qr.party_id === current.party_id);
          if (existingIndex === -1) {
            acc.push(current);
          } else {
            // Keep the more recent one (or the approved one if exists)
            if (new Date(current.created_at) > new Date(acc[existingIndex].created_at) || 
                (current.is_approved && !acc[existingIndex].is_approved)) {
              acc[existingIndex] = current;
            }
          }
          return acc;
        }, []);
        setQRCodes(uniqueQRCodes);
      }
    } catch (error) {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadQRCodes();
  }, [loadQRCodes]);

  return { qrCodes, loading, refetch: loadQRCodes };
};
