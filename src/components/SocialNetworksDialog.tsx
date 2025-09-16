import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface SocialNetworksDialogProps {
  isOpen: boolean;
  onClose: () => void;
  missingSocials: string[];
  onFillNow: () => void;
}

const SocialNetworksDialog = ({ isOpen, onClose, missingSocials, onFillNow }: SocialNetworksDialogProps) => {
  const { t } = useLanguage();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('social_media_required')}</DialogTitle>
          <DialogDescription>
            {t('social_media_required_description')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">{t('missing_social_networks')}:</p>
            <ul className="list-disc list-inside space-y-1">
              {missingSocials.map((social) => (
                <li key={social} className="text-sm text-muted-foreground capitalize">
                  {social}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button onClick={onFillNow}>
              {t('fill_now')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SocialNetworksDialog;