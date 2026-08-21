import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, LogIn, QrCode, Ticket } from 'lucide-react';

interface OnboardingWalkthroughProps {
  userId: string;
}

const steps = [
  {
    icon: LogIn,
    title: 'Welcome to Trance Tribes',
    body: "You're signed in. This short walkthrough shows how to get a ticket and get through the gate in under a minute.",
  },
  {
    icon: Calendar,
    title: '1. Find your event',
    body: 'Open the Events & Parties tile to browse everything the productions you follow have coming up.',
  },
  {
    icon: Ticket,
    title: '2. Get your ticket',
    body: 'Buy a ticket for the event. Your personal QR code is generated automatically and appears under "Your tickets" on the dashboard.',
  },
  {
    icon: QrCode,
    title: '3. Use the button on your ticket',
    body: 'Once the production approves your ticket, the button on the ticket card turns active — press it to open your QR code full size and show it at the entrance.',
  },
];

const OnboardingWalkthrough = ({ userId }: OnboardingWalkthroughProps) => {
  const storageKey = `onboarding-complete-${userId}`;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(storageKey) !== 'true') {
      setOpen(true);
    }
  }, [storageKey]);

  const finish = () => {
    localStorage.setItem(storageKey, 'true');
    setOpen(false);
  };

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) finish();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div
            aria-hidden="true"
            className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary"
          >
            <Icon className="h-7 w-7" />
          </div>
          <DialogTitle className="text-center">{current.title}</DialogTitle>
          <DialogDescription className="text-center">{current.body}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-2" aria-hidden="true">
          {steps.map((s, i) => (
            <span
              key={s.title}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted'
              }`}
            />
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          Step {step + 1} of {steps.length}
        </p>

        <div className="flex gap-2">
          <Button variant="outline" className="min-h-11 flex-1" onClick={finish}>
            Skip
          </Button>
          <Button
            className="min-h-11 flex-1"
            onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
          >
            {isLast ? "Let's go" : 'Next'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingWalkthrough;
