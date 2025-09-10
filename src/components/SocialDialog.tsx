import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SocialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  socials: Array<{
    platform: string;
    handle?: string;
    url?: string;
  }>;
}

const SocialDialog: React.FC<SocialDialogProps> = ({ open, onOpenChange, socials }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Social Media Profiles</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {socials.length === 0 ? (
            <p className="text-muted-foreground">No social media profiles added</p>
          ) : (
            socials.map((social, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <span className="font-medium">{social.platform}</span>
                  {social.handle && <span className="text-muted-foreground"> - @{social.handle}</span>}
                </div>
                {social.url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(social.url, '_blank')}
                  >
                    View
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SocialDialog;