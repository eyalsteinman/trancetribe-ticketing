import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HayaNinjaProps {
  onBack: () => void;
  scope?: 'admin' | 'user';
  playerNickname?: string;
}

interface Point { x: number; y: number }

const HayaNinja = ({ onBack, scope = 'user', playerNickname = '' }: HayaNinjaProps) => {
  const [bgColor, setBgColor] = useState('hsl(220,70%,50%)');
  const [lines, setLines] = useState<number>(0);
  const [path, setPath] = useState<Point[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [highScore, setHighScore] = useState<{ score: number; nickname: string }>({ score: 0, nickname: '' });
  const contRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Background color change every 10s
  useEffect(() => {
    const id = window.setInterval(() => {
      const h = Math.floor(Math.random() * 360);
      setBgColor(`hsl(${h},70%,50%)`);
    }, 10000);
    return () => window.clearInterval(id);
  }, []);

  // Disable pull-to-refresh / scrolling gestures
  useEffect(() => {
    const prev = document.body.style.overscrollBehavior;
    document.body.style.overscrollBehavior = 'none';
    const prevent = (e: TouchEvent) => e.preventDefault();
    window.addEventListener('touchmove', prevent, { passive: false });
    return () => {
      document.body.style.overscrollBehavior = prev;
      window.removeEventListener('touchmove', prevent as any);
    };
  }, []);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem(`haya-highscore-${scope}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'number') setHighScore({ score: parsed, nickname: '' });
        else setHighScore({ score: parsed.score || 0, nickname: parsed.nickname || '' });
      } catch {
        setHighScore({ score: parseInt(saved, 10) || 0, nickname: '' });
      }
    }
  }, [scope]);

  useEffect(() => {
    if (lines > highScore.score) {
      const toSave = { score: lines, nickname: playerNickname || '' };
      setHighScore(toSave);
      localStorage.setItem(`haya-highscore-${scope}`, JSON.stringify(toSave));
    }
  }, [lines, highScore.score, scope, playerNickname]);

  // Timer
  useEffect(() => {
    if (!gameStarted) return;
    intervalRef.current = window.setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [gameStarted]);

  useEffect(() => {
    if (gameStarted && timeLeft <= 0) {
      setGameStarted(false);
      toast({ title: `you made ${lines} thats great!` });
    }
  }, [timeLeft, gameStarted, lines, toast]);

  const start = () => {
    setLines(0);
    setTimeLeft(120);
    setGameStarted(true);
  };

  const onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!gameStarted) return;
    e.preventDefault();
    const rect = contRef.current?.getBoundingClientRect();
    if (!rect) return;
    let x = 0, y = 0;
    if ('touches' in e) {
      if (e.touches.length !== 1) return;
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }
    setPath([{ x, y }]);
  };

  const onPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!gameStarted || path.length === 0) return;
    e.preventDefault();
    const rect = contRef.current?.getBoundingClientRect();
    if (!rect) return;
    let x = 0, y = 0;
    if ('touches' in e) {
      if (!e.touches[0]) return;
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }
    setPath((p) => [...p, { x, y }]);
  };

  const onPointerUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (!gameStarted) return;
    e.preventDefault();
    if (path.length > 1) setLines((l) => l + 1);
    setPath([]);
  };

  return (
    <div
      ref={contRef}
      className="min-h-screen relative overflow-hidden select-none transition-colors duration-500 touch-none overscroll-none"
      style={{ backgroundColor: bgColor, touchAction: 'none' }}
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}
      onTouchStart={onPointerDown}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Back button */}
      <button
        className="absolute top-4 left-4 z-[9999] px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg backdrop-blur-md transition-all shadow-xl font-medium"
        onClick={onBack}
      >
        <ArrowLeft className="inline-block h-4 w-4 mr-2" /> Back
      </button>

      {/* Scoreboard */}
      <div className="absolute top-4 right-4 z-[9999] text-right text-white">
        <div className="text-sm opacity-90">Lines</div>
        <div className="text-2xl font-bold">{lines}</div>
        <div className="mt-1 text-xs opacity-80">High score ({scope})</div>
        <div className="text-lg font-semibold">{highScore.score}</div>
        {highScore.nickname ? (
          <div className="text-xs opacity-80">{highScore.nickname}</div>
        ) : null}
        {gameStarted && (
          <div className="text-xs opacity-80 mt-2">Time left: {timeLeft}s</div>
        )}
      </div>

      {/* Start overlay */}
      {!gameStarted && (
        <div className="absolute inset-0 flex items-center justify-center z-[9000]">
          <Button onClick={start} className="bg-white/20 hover:bg-white/30 text-white border border-white/20">Start Game</Button>
        </div>
      )}

      {/* Current drawing path */}
      {path.length > 1 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
          <path
            d={`M ${path[0].x} ${path[0].y} ${path.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}`}
            stroke="white"
            strokeWidth="2"
            fill="none"
            opacity="0.8"
          />
        </svg>
      )}

      {/* Game name footer */}
      <div className="absolute bottom-2 left-0 right-0 text-center text-white/80 text-xs z-[9000]">Haya Ninja</div>
    </div>
  );
};

export default HayaNinja;
