import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SocialNetworksDialogProps {
  isOpen: boolean;
  onClose: () => void;
  missingSocials: string[];
  onFillNow: () => void;
}

const SocialNetworksDialog = ({ isOpen, onClose, missingSocials, onFillNow }: SocialNetworksDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Social Media Required</DialogTitle>
          <DialogDescription>
            To purchase tickets for this event, you need to connect the following social media accounts:
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Missing social networks:</p>
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
              Cancel
            </Button>
            <Button onClick={onFillNow}>
              Fill Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SocialNetworksDialog;