import { useEffect, useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface ExploderGameProps {
  onBack: () => void;
  scope?: 'admin' | 'user'; // per-scope high score
}

interface FallingBall {
  x: number; // relative to container
  y: number; // relative to container
  radius: number;
  active: boolean;
  enteredBuilding: boolean;
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

const ExploderGame = ({ onBack, scope = 'user' }: ExploderGameProps) => {
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
  const [highScore, setHighScore] = useState(0);

  // Local background color that changes per level
  const [bgColor, setBgColor] = useState<string>('hsl(220, 70%, 50%)');

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

  const randomHsl = () => {
    const h = Math.floor(Math.random() * 360);
    const s = 70;
    const l = 45;
    return `hsl(${h}, ${s}%, ${l}%)`;
  };

  // mount
  useEffect(() => {
    initBoard(1);
    const stored = localStorage.getItem(`exploder-highscore-${scope}`);
    if (stored) setHighScore(parseInt(stored, 10) || 0);
  }, [scope]);

  useEffect(() => {
    if (destroyedTotal > highScore) {
      setHighScore(destroyedTotal);
      localStorage.setItem(`exploder-highscore-${scope}`, String(destroyedTotal));
    }
  }, [destroyedTotal, highScore, scope]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!ballAvailable) return;
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
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
    setFallingBall({ x: startX, y: startY, radius: SMALL_RADIUS, active: true, enteredBuilding: false });
  };

  const handleMouseUp = () => {
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
        let { x, y, radius, active, enteredBuilding } = prev;

        y += velocityRef.current;
        velocityRef.current = Math.min(velocityRef.current + 0.4, 20);

        if (radius > 1) radius = Math.max(1, radius - 0.7);

        if (buildingRect) {
          const xAbs = containerRect.left + x;
          const yAbs = containerRect.top + y;
          const insideX = xAbs >= buildingRect.left && xAbs <= buildingRect.right;
          const insideY = yAbs >= buildingRect.top && yAbs <= buildingRect.bottom;
          if (insideX && insideY) enteredBuilding = true;
        }

        const offBottom = y > containerRect.height + 50;
        const fullyShrunk = radius <= 1;

        if (offBottom || fullyShrunk) {
          active = false;

          if (enteredBuilding && buildingRect) {
            const xAbs = containerRect.left + x;
            const yAbs = containerRect.top + y;
            const relX = xAbs - buildingRect.left;
            const relY = yAbs - buildingRect.top;
            const gridX = Math.floor(relX / CUBE_SIZE);
            const gridY = Math.floor(relY / CUBE_SIZE);

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
          }

          setTimeout(() => setBallAvailable(true), 0);

          return { x, y, radius, active, enteredBuilding };
        }

        return { x, y, radius, active, enteredBuilding };
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
      setBgColor(randomHsl());
      initBoard(next);
    }
  }, [cubes]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative overflow-hidden select-none transition-colors duration-500"
      style={{ backgroundColor: bgColor }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Exit */}
      <button
        className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg backdrop-blur-md transition-all shadow-xl font-medium"
        onClick={onBack}
      >
        Exit
      </button>

      {/* Scoreboard */}
      <div className="absolute top-4 right-4 z-50 text-right text-white">
        <div className="text-sm opacity-90">Total pixels destroyed</div>
        <div className="text-2xl font-bold">{destroyedTotal}</div>
        <div className="mt-1 text-xs opacity-80">High score ({scope})</div>
        <div className="text-lg font-semibold">{highScore}</div>
      </div>

      {/* Single draggable small white circle */}
      {ballAvailable && (
        <div className="absolute left-8 top-1/2 -translate-y-1/2">
          <div
            className="bg-white rounded-full cursor-grab active:cursor-grabbing transition-transform duration-200 hover:scale-110 shadow-lg"
            style={{ width: SMALL_RADIUS * 2, height: SMALL_RADIUS * 2 }}
            onMouseDown={handleMouseDown}
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
    </div>
  );
};

export default ExploderGame;
