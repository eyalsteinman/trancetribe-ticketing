import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface SocialNetworksPromptProps {
  userId: string;
  onClose: () => void;
}

const SocialNetworksPrompt = ({ userId, onClose }: SocialNetworksPromptProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    checkSocialNetworks();
  }, [userId]);

  const checkSocialNetworks = async () => {
    try {
      const { data: socials, error } = await supabase
        .from('user_socials')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error checking social networks:', error);
        return;
      }

      // Show dialog if user has no social networks
      if (!socials || socials.length === 0) {
        setShowDialog(true);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleClose = () => {
    setShowDialog(false);
    onClose();
  };

  return (
    <Dialog open={showDialog} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Social Network Profiles Required</DialogTitle>
          <DialogDescription className="space-y-3 pt-4">
            <p>
              Social network profiles are required to buy tickets for events. Without them, you won't be able to purchase tickets.
            </p>
            <p>
              You can add your social networks now or later in the Social Networks tab.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleClose}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SocialNetworksPrompt;
