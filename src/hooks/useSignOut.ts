import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSignOut = () => {
  const { toast } = useToast();

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      if (error && !error.message.includes('Session not found')) {
        toast({
          title: "Warning",
          description: "Logged out locally, but server logout failed.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Signed out successfully!",
        });
      }
    } catch (error) {
      toast({
        title: "Info", 
        description: "Logged out locally.",
      });
    }
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }, [toast]);

  return { signOut };
};