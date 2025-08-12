import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { useBackground } from '@/contexts/BackgroundContext';
import { useToast } from '@/hooks/use-toast';

interface BoredScreenProps {
  onBack: () => void;
}

// A rich color palette (HSL) for quick cycling
const PALETTE = [
  'hsl(200, 80%, 55%)', 'hsl(260, 80%, 60%)', 'hsl(320, 80%, 60%)', 'hsl(20, 85%, 55%)',
  'hsl(160, 70%, 45%)', 'hsl(45, 90%, 55%)', 'hsl(280, 70%, 55%)', 'hsl(340, 75%, 55%)',
  'hsl(220, 75%, 50%)', 'hsl(180, 70%, 45%)', 'hsl(100, 60%, 45%)', 'hsl(30, 85%, 55%)',
  'hsl(0, 75%, 55%)', 'hsl(210, 80%, 45%)', 'hsl(250, 80%, 55%)', 'hsl(290, 70%, 55%)'
];

const BoredScreen = ({ onBack }: BoredScreenProps) => {
  const { backgroundColor: globalBg, setGlobalBackground, isBackgroundDark } = useBackground();
  const [backgroundColor, setBackgroundColor] = useState(globalBg);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [showWheel, setShowWheel] = useState(false);
  const [wheelHue, setWheelHue] = useState(200);
  const wheelRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Sync local when global changes
    setBackgroundColor(globalBg);
  }, [globalBg]);

  const cycleColor = () => {
    const next = (paletteIndex + 1) % PALETTE.length;
    const nextColor = PALETTE[next];
    setPaletteIndex(next);
    setBackgroundColor(nextColor);
    // Apply globally immediately
    setGlobalBackground(nextColor);
  };

  const save = () => {
    setGlobalBackground(backgroundColor);
    toast({ title: 'Saved', description: 'Background applied globally.' });
  };

  const revert = () => {
    setBackgroundColor('hsl(0, 0%, 100%)');
    setGlobalBackground('hsl(0, 0%, 100%)');
    toast({ title: 'Reverted', description: 'Background set to white.' });
  };

  // Convert pointer position to hue
  const handleWheelMove = (clientX: number, clientY: number) => {
    const el = wheelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const angle = Math.atan2(clientY - cy, clientX - cx); // -PI..PI
    let deg = Math.round((angle * 180) / Math.PI);
    if (deg < 0) deg += 360;
    setWheelHue(deg);
    const color = `hsl(${deg}, 80%, 55%)`;
    setBackgroundColor(color);
    // Apply globally immediately
    setGlobalBackground(color);
  };
  const onWheelPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const move = (x: number, y: number) => handleWheelMove(x, y);
    const up = () => {
      setShowWheel(false);
      window.removeEventListener('mousemove', onMouseMove as any);
      window.removeEventListener('mouseup', onMouseUp as any);
      window.removeEventListener('touchmove', onTouchMove as any);
      window.removeEventListener('touchend', onTouchEnd as any);
    };

    const onMouseMove = (me: MouseEvent) => move(me.clientX, me.clientY);
    const onMouseUp = () => up();
    const onTouchMove = (te: TouchEvent) => {
      if (te.touches[0]) move(te.touches[0].clientX, te.touches[0].clientY);
      te.preventDefault();
    };
    const onTouchEnd = () => up();

    if ('touches' in e) {
      const t = (e as React.TouchEvent).touches[0];
      move(t.clientX, t.clientY);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd, { passive: false });
    } else {
      const m = e as React.MouseEvent;
      move(m.clientX, m.clientY);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative transition-colors duration-500 select-none touch-none overscroll-none"
      style={{ backgroundColor }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Back button - top left */}
      <Button
        variant="outline"
        onClick={onBack}
        className={`absolute top-4 left-4 z-[9999] ${isBackgroundDark ? 'text-white border-white/60 hover:bg-white/10' : ''}`}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Save + Revert - top right */}
      <div className="absolute top-4 right-4 z-[9999] flex gap-2">
        <Button
          onClick={save}
          size="sm"
          className="bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-all duration-300 shadow-lg px-4 py-2 text-sm"
        >
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button
          onClick={revert}
          size="sm"
          className="bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-all duration-300 shadow-lg px-4 py-2 text-sm"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Revert
        </Button>
      </div>

      {/* Center controls */}
      <div className="flex flex-col items-center gap-6">
        {/* Main round glass button with two-line label */}
        <Button
        onClick={cycleColor}
          className="rounded-full w-40 h-40 bg-white/10 border border-white/20 backdrop-blur-lg shadow-2xl hover:bg-white/20 active:scale-95 transition-all duration-300 flex flex-col items-center justify-center text-center"
        >
          <span className="leading-tight font-semibold">
            Change
            <br />
            Color
          </span>
        </Button>

      </div>

    </div>
  );
};

export default BoredScreen;
