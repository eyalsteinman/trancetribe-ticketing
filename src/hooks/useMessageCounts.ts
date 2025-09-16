import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useMessageCounts = (userId?: string) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadDirectCount, setUnreadDirectCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadCounts = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const [messagesResult, directMessagesResult] = await Promise.all([
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', userId)
          .eq('is_read', false),
        supabase
          .from('direct_messages')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', userId)
          .eq('is_read', false)
      ]);

      setUnreadCount(messagesResult.count || 0);
      setUnreadDirectCount(directMessagesResult.count || 0);
    } catch (error) {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadCounts();
    
    // Set up a more efficient polling interval
    const interval = setInterval(loadCounts, 60000); // 1 minute instead of 30 seconds
    
    return () => clearInterval(interval);
  }, [loadCounts]);

  return { unreadCount, unreadDirectCount, loading, refetch: loadCounts };
};