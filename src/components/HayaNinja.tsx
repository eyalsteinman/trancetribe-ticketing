import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/ui/back-button';
import { useToast } from '@/hooks/use-toast';
import { useBackground } from '@/contexts/BackgroundContext';
import { useBackNavigation } from '@/hooks/useBackNavigation';
import Footer from '@/components/ui/footer';

interface HayaNinjaProps {
  onBack: () => void;
  scope?: 'admin' | 'user';
  playerNickname?: string;
}

interface Point { x: number; y: number }

const HayaNinja = ({ onBack, scope = 'user', playerNickname = '' }: HayaNinjaProps) => {
  const { backgroundColor } = useBackground();
  
  useBackNavigation({
    onBackNavigation: onBack,
    isActive: true
  });
  const [lines, setLines] = useState<number>(0);
  const [path, setPath] = useState<Point[]>([]);
  const [allPaths, setAllPaths] = useState<Point[][]>([]); // persistent scratches
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showEndPopup, setShowEndPopup] = useState(false);
  const [highScore, setHighScore] = useState<{ score: number; nickname: string }>({ score: 0, nickname: '' });
  const contRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);
  const lastTurnIndexRef = useRef<number>(0);
  const lastTurnPointRef = useRef<Point | null>(null);
  const { toast } = useToast();


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
      const displayName = playerNickname || (scope === 'admin' ? 'Admin' : 'User');
      const toSave = { score: lines, nickname: displayName };
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
      setShowEndPopup(true);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    }
  }, [timeLeft, gameStarted]);

  const start = () => {
    setLines(0);
    setTimeLeft(60);
    setAllPaths([]);
    setPath([]);
    setShowEndPopup(false);
    setGameStarted(true);
  };

const handleBack = () => {
  if (intervalRef.current) window.clearInterval(intervalRef.current);
  setGameStarted(false);
  setPath([]);
  setAllPaths([]);
  setShowEndPopup(false);
  setTimeLeft(60);
  onBack();
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
    lastTurnIndexRef.current = 0;
    lastTurnPointRef.current = { x, y };
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
    setPath((prev) => {
      const next = [...prev, { x, y }];
      if (prev.length >= 2) {
        const a = prev[prev.length - 2];
        const b = prev[prev.length - 1];
        const v1x = b.x - a.x;
        const v1y = b.y - a.y;
        const v2x = x - b.x;
        const v2y = y - b.y;
        const len1 = Math.hypot(v1x, v1y);
        const len2 = Math.hypot(v2x, v2y);
        if (len1 > 3 && len2 > 3) {
          const dot = v1x * v2x + v1y * v2y;
          const cos = Math.min(1, Math.max(-1, dot / (len1 * len2)));
          const angleDeg = Math.acos(cos) * (180 / Math.PI);
          const lastPoint = lastTurnPointRef.current;
          const distSince = lastPoint ? Math.hypot(b.x - lastPoint.x, b.y - lastPoint.y) : Infinity;
          if (angleDeg >= 45 && distSince >= 20) {
            setLines((l) => l + 1);
            lastTurnIndexRef.current = next.length - 1;
            lastTurnPointRef.current = { x: b.x, y: b.y };
          }
        }
      }
      return next;
    });
  };

  const onPointerUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (!gameStarted) return;
    e.preventDefault();
    if (path.length > 1) setAllPaths((paths) => [...paths, path]);
    setPath([]);
    lastTurnIndexRef.current = 0;
    lastTurnPointRef.current = null;
  };

  return (
    <div
      ref={contRef}
      className="min-h-screen relative overflow-hidden select-none transition-colors duration-500 touch-none overscroll-none"
      style={{ backgroundColor, touchAction: 'none' }}
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}
      onTouchStart={onPointerDown}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="absolute top-4 right-4 z-[9999]">
        <BackButton onBack={handleBack} />
      </div>

      {/* Scoreboard */}
      <div className="absolute top-4 right-4 z-[9999] text-right text-white">
        <div className="text-sm opacity-90">Lines</div>
        <div className="text-5xl font-extrabold">{lines}</div>
        <div className="mt-1 text-xs opacity-80">High score ({scope})</div>
        <div className="text-2xl font-semibold">{highScore.score}</div>
        <div className="text-xs opacity-80">{highScore.nickname || (playerNickname || (scope === 'admin' ? 'Admin' : 'User'))}</div>
        {gameStarted && (
          <div className="text-xs opacity-80 mt-2">Time left: {timeLeft}s</div>
        )}
      </div>

      {/* Start overlay */}
      {!gameStarted && !showEndPopup && (
        <div className="absolute inset-0 flex items-center justify-center z-[9000]">
          <Button onClick={start} className="bg-white/20 hover:bg-white/30 text-white border border-white/20">Start Game</Button>
        </div>
      )}

      {/* End popup */}
      {showEndPopup && (
        <div className="absolute inset-0 flex items-center justify-center z-[9500]">
          <div className="bg-black/60 text-white rounded-xl p-6 border border-white/20 backdrop-blur-lg text-center space-y-3">
            <div className="text-2xl font-bold">Great job!</div>
            <div className="text-sm opacity-90">You made {lines} lines.</div>
            <div className="flex gap-3 justify-center pt-2">
              <Button onClick={start} className="bg-white/20 hover:bg-white/30 text-white border border-white/20">Play Again</Button>
              <Button variant="outline" onClick={handleBack}>Back to Menu</Button>
            </div>
          </div>
        </div>
      )}

      {/* Persisted scratches */}
      {allPaths.length > 0 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
          {allPaths.map((p, idx) => (
            p.length > 1 ? (
              <path
                key={idx}
                d={`M ${p[0].x} ${p[0].y} ${p.slice(1).map(pt => `L ${pt.x} ${pt.y}`).join(' ')}`}
                stroke="white"
                strokeWidth="2"
                fill="none"
                opacity="0.8"
              />
            ) : null
          ))}
        </svg>
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
      <div className="absolute bottom-8 left-0 right-0 text-center text-white/80 text-lg font-semibold z-[9000]">Haya Ninja</div>
      
      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <Footer />
      </div>
    </div>
  );
};

export default HayaNinja;
