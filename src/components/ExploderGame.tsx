import { useEffect, useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useBackground } from '@/contexts/BackgroundContext';

interface ExploderGameProps {
  onBack: () => void;
  scope?: 'admin' | 'user'; // per-scope high score
  playerNickname?: string; // display on high score
}

interface FallingBall {
  x: number; // relative to container
  y: number; // relative to container
  radius: number;
  active: boolean;
  enteredBuilding: boolean;
  // impact position relative to building when first entered
  impactRelX?: number;
  impactRelY?: number;
  explodedDone?: boolean; // ensure we only destroy once
}

interface Cube {
  id: string;
  x: number; // grid col
  y: number; // grid row
  visible: boolean;
}

const GRID_COLS = 10;
const GRID_ROWS = 15;
const CUBE_SIZE = 16; // pixels (w-4 h-4)

const ExploderGame = ({ onBack, scope = 'user', playerNickname = '' }: ExploderGameProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const buildingRef = useRef<HTMLDivElement>(null);

  // Single small ball
  const SMALL_RADIUS = 20; // diameter 40px
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [ballAvailable, setBallAvailable] = useState(true);

  // Falling
  const [fallingBall, setFallingBall] = useState<FallingBall | null>(null);
  const velocityRef = useRef(6);
  const rafRef = useRef<number | null>(null);

  // Level and board
  const [level, setLevel] = useState(1);
  const [cubes, setCubes] = useState<Cube[]>([]);

  // Score
  const [destroyedTotal, setDestroyedTotal] = useState(0);
  const [highScore, setHighScore] = useState<{ score: number; nickname: string }>({ score: 0, nickname: '' });
  const [centerMessage, setCenterMessage] = useState<string | null>(null);

  // Use global app background color
  const { backgroundColor } = useBackground();

  const initBoard = (lvl: number) => {
    const targetPixels = Math.min(GRID_COLS * GRID_ROWS, 8 * Math.pow(2, lvl - 1));

    const all: Cube[] = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        all.push({ id: `${row}-${col}`, x: col, y: row, visible: false });
      }
    }

    const indices = new Set<number>();
    while (indices.size < targetPixels && indices.size < all.length) {
      indices.add(Math.floor(Math.random() * all.length));
    }
    indices.forEach((idx) => (all[idx].visible = true));

    setCubes(all);
  };


  // mount
  useEffect(() => {
    initBoard(1);
    const stored = localStorage.getItem(`exploder-highscore-${scope}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'number') {
          setHighScore({ score: parsed, nickname: '' });
        } else if (parsed && typeof parsed.score === 'number') {
          setHighScore({ score: parsed.score, nickname: parsed.nickname || '' });
        }
      } catch {
        setHighScore({ score: parseInt(stored, 10) || 0, nickname: '' });
      }
    }
  }, [scope]);

  useEffect(() => {
    if (destroyedTotal > highScore.score) {
      const displayName = playerNickname || (scope === 'admin' ? 'Admin' : 'User');
      const toSave = { score: destroyedTotal, nickname: displayName };
      setHighScore(toSave);
      localStorage.setItem(`exploder-highscore-${scope}`, JSON.stringify(toSave));
    }
  }, [destroyedTotal, highScore.score, scope, playerNickname]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!ballAvailable) return;
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setBallAvailable(false);
    setIsDragging(true);
    setDragPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

const startFalling = (startX: number, startY: number) => {
  setBallAvailable(false);
  velocityRef.current = 6;
  setFallingBall({ x: startX, y: startY, radius: SMALL_RADIUS, active: true, enteredBuilding: false, explodedDone: false });
};

  const handleMouseUp = () => {
    if (!isDragging || !dragPos) return;
    setIsDragging(false);
    startFalling(dragPos.x, dragPos.y);
    setDragPos(null);
  };

  // Touch support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!ballAvailable) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const t = e.touches[0];
    setBallAvailable(false);
    setIsDragging(true);
    setDragPos({ x: t.clientX - rect.left, y: t.clientY - rect.top });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const t = e.touches[0];
    setDragPos({ x: t.clientX - rect.left, y: t.clientY - rect.top });
  };

  const handleTouchEnd = () => {
    if (!isDragging || !dragPos) return;
    setIsDragging(false);
    startFalling(dragPos.x, dragPos.y);
    setDragPos(null);
  };
  // Animate falling
  useEffect(() => {
    if (!fallingBall || !fallingBall.active) return;

    const step = () => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      const buildingRect = buildingRef.current?.getBoundingClientRect();
      if (!containerRect) return;

setFallingBall((prev) => {
  if (!prev) return prev;
  let { x, y, radius, active, enteredBuilding, impactRelX, impactRelY, explodedDone } = prev;

  if (!enteredBuilding) {
    y += velocityRef.current;
    velocityRef.current = Math.min(velocityRef.current + 0.4, 20);
  } else {
    // Simulate "falling into" the building on Z-axis by keeping roughly same Y and shrinking
    if (buildingRect) {
      const targetY = buildingRect.top + buildingRect.height / 2 - containerRect.top;
      y += (targetY - y) * 0.08; // ease toward building center
    }
  }

  if (radius > 1) radius = Math.max(1, radius - 0.7);

  if (buildingRect) {
    const xAbs = containerRect.left + x;
    const yAbs = containerRect.top + y;
    const insideX = xAbs >= buildingRect.left && xAbs <= buildingRect.right;
    const insideY = yAbs >= buildingRect.top && yAbs <= buildingRect.bottom;
    if (insideX && insideY && !enteredBuilding) {
      enteredBuilding = true;
      impactRelX = xAbs - buildingRect.left;
      impactRelY = yAbs - buildingRect.top;
      // explode immediately once
      if (!explodedDone) {
        const gridX = Math.floor(impactRelX / CUBE_SIZE);
        const gridY = Math.floor(impactRelY / CUBE_SIZE);
        let destroyed = 0;
        setCubes((prevCubes) =>
          prevCubes.map((cube) => {
            if (!cube.visible) return cube;
            const dist = Math.hypot(cube.x - gridX, cube.y - gridY);
            if (dist <= 1) {
              destroyed += 1;
              return { ...cube, visible: false };
            }
            return cube;
          })
        );
        if (destroyed > 0) setDestroyedTotal((t) => t + destroyed);
        explodedDone = true;
        setCenterMessage('fuckinshit!');
      }
    }
  }

  const offBottom = y > containerRect.height + 50;
  const fullyShrunk = radius <= 1;

  if (offBottom || fullyShrunk) {
    active = false;

    // show message and respawn after delay
    if (!enteredBuilding) setCenterMessage('missed');
    setTimeout(() => {
      setCenterMessage(null);
      setBallAvailable(true);
    }, 2000);

    return { x, y, radius, active, enteredBuilding, impactRelX, impactRelY, explodedDone };
  }

  return { x, y, radius, active, enteredBuilding, impactRelX, impactRelY, explodedDone };
});

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [fallingBall]);

  // Level cleared
  useEffect(() => {
    if (cubes.length > 0 && cubes.every((c) => !c.visible)) {
      toast({ title: 'Super! Level passed!' });
      const next = level + 1;
      setLevel(next);
      initBoard(next);
    }
  }, [cubes]);

  useEffect(() => {
    const prev = document.body.style.overscrollBehavior;
    document.body.style.overscrollBehavior = 'none';
    const preventTouch = (e: TouchEvent) => {
      e.preventDefault();
    };
    window.addEventListener('touchmove', preventTouch, { passive: false });
    return () => {
      document.body.style.overscrollBehavior = prev;
      window.removeEventListener('touchmove', preventTouch as any);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative overflow-hidden select-none transition-colors duration-500 touch-none overscroll-none"
      style={{ backgroundColor, touchAction: 'none' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={(e) => { e.preventDefault(); handleTouchMove(e); }}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Button
        className="absolute top-4 left-4 z-[9999] on-color back-button"
        variant="outline"
        size="icon"
        aria-label="Back"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      {/* Scoreboard */}
      <div className="absolute right-4 z-[9999] text-right text-white" style={{ top: 'calc(env(safe-area-inset-top) + 8px)' }}>
        <div className="text-sm opacity-90">Total pixels destroyed</div>
        <div className="text-2xl font-bold">{destroyedTotal}</div>
        <div className="mt-1 text-xs opacity-80">High score ({scope})</div>
        <div className="text-lg font-semibold">{highScore.score}</div>
        <div className="text-xs opacity-80">{highScore.nickname || (playerNickname || (scope === 'admin' ? 'Admin' : 'User'))}</div>
      </div>

      {/* Messages - centered on screen */}
      {centerMessage && (
        <div className="absolute inset-0 flex items-center justify-center z-[9500] pointer-events-none">
          <div className="mx-auto w-fit px-3 py-1 bg-black/40 text-white rounded-md border border-white/20 backdrop-blur-sm text-2xl font-extrabold">
            {centerMessage}
          </div>
        </div>
      )}


      {/* Single draggable small white circle */}
      {ballAvailable && (
        <div className="absolute left-8 top-1/2 -translate-y-1/2">
          <div
            className="bg-white rounded-full cursor-grab active:cursor-grabbing transition-transform duration-200 hover:scale-110 shadow-lg"
            style={{ width: SMALL_RADIUS * 2, height: SMALL_RADIUS * 2 }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          />
        </div>
      )}

      {/* Building of pixels (white) */}
      <div ref={buildingRef} className="absolute right-16 top-1/2 -translate-y-1/2">
        <div className="grid grid-cols-10 gap-0">
          {cubes.map((cube) => (
            <div
              key={cube.id}
              className={`${cube.visible ? 'bg-white opacity-100' : 'opacity-0'} w-4 h-4 border border-white/30 transition-opacity duration-300`}
              style={{ gridColumn: cube.x + 1, gridRow: cube.y + 1 }}
            />
          ))}
        </div>
      </div>

      {/* Drag ghost */}
      {isDragging && dragPos && (
        <div
          className="absolute bg-white rounded-full pointer-events-none z-40 shadow"
          style={{
            width: SMALL_RADIUS * 2,
            height: SMALL_RADIUS * 2,
            left: dragPos.x - SMALL_RADIUS,
            top: dragPos.y - SMALL_RADIUS,
          }}
        />
      )}

      {/* Falling ball */}
      {fallingBall && fallingBall.active && (
        <div
          className="absolute bg-white rounded-full pointer-events-none z-40 shadow"
          style={{
            width: fallingBall.radius * 2,
            height: fallingBall.radius * 2,
            left: fallingBall.x - fallingBall.radius,
            top: fallingBall.y - fallingBall.radius,
          }}
        />
      )}

      {/* Game name footer */}
      <div className="absolute bottom-2 left-0 right-0 text-center text-white/80 text-xs z-[9000]">Exploder</div>
    </div>
  );
};

export default ExploderGame;
