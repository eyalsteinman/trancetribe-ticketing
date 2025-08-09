import { useState, useRef } from 'react';

interface ExploderGameProps {
  onBack: () => void;
}

interface Ball {
  id: string;
  size: 'large' | 'medium' | 'small';
  radius: number;
  selected: boolean;
  isDragging?: boolean;
  dragPosition?: { x: number; y: number };
}

interface Cube {
  id: string;
  x: number;
  y: number;
  visible: boolean;
}

const ExploderGame = ({ onBack }: ExploderGameProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const buildingRef = useRef<HTMLDivElement>(null);
  const [draggedBall, setDraggedBall] = useState<Ball | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

  // Initialize balls
  const [balls] = useState<Ball[]>([
    { id: 'large', size: 'large', radius: 40, selected: false },
    { id: 'medium', size: 'medium', radius: 30, selected: false },
    { id: 'small', size: 'small', radius: 20, selected: false }
  ]);

  // Initialize building cubes (10x15 grid)
  const [cubes, setCubes] = useState<Cube[]>(() => {
    const initialCubes: Cube[] = [];
    for (let row = 0; row < 15; row++) {
      for (let col = 0; col < 10; col++) {
        initialCubes.push({
          id: `${row}-${col}`,
          x: col,
          y: row,
          visible: true
        });
      }
    }
    return initialCubes;
  });

  const handleBallMouseDown = (ball: Ball, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggedBall(ball);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedBall && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDragPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (draggedBall && buildingRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const buildingRect = buildingRef.current.getBoundingClientRect();
      
      const relativeX = e.clientX - buildingRect.left;
      const relativeY = e.clientY - buildingRect.top;
      
      // Check if dropped on building
      if (relativeX >= 0 && relativeX <= buildingRect.width && 
          relativeY >= 0 && relativeY <= buildingRect.height) {
        
        // Calculate which cube was hit (convert pixel position to grid position)
        const cubeSize = 16; // 4 * 4 (w-4 h-4)
        const gridX = Math.floor(relativeX / cubeSize);
        const gridY = Math.floor(relativeY / cubeSize);
        
        // Calculate crater size based on ball size
        let craterRadius: number;
        switch (draggedBall.size) {
          case 'large':
            craterRadius = 3;
            break;
          case 'medium':
            craterRadius = 2;
            break;
          case 'small':
            craterRadius = 1;
            break;
          default:
            craterRadius = 1;
        }

        // Create crater at drop location
        setCubes(prevCubes => 
          prevCubes.map(cube => {
            const distance = Math.sqrt(
              Math.pow(cube.x - gridX, 2) + Math.pow(cube.y - gridY, 2)
            );
            
            if (distance <= craterRadius) {
              return { ...cube, visible: false };
            }
            return cube;
          })
        );
      }
    }
    
    setDraggedBall(null);
    setDragPosition(null);
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen relative overflow-hidden select-none"
      style={{ backgroundColor: '#3b82f6' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Exit Button */}
      <button 
        className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-lg backdrop-blur-md transition-all shadow-xl font-medium"
        onClick={onBack}
      >
        Exit
      </button>

      {/* Balls on the left side */}
      <div className="absolute left-8 top-1/2 transform -translate-y-1/2 flex flex-col gap-8">
        {balls.map((ball) => (
          <div
            key={ball.id}
            className={`bg-black rounded-full cursor-grab active:cursor-grabbing transition-all duration-200 ${
              draggedBall?.id === ball.id ? 'ring-4 ring-white' : 'hover:scale-110'
            }`}
            style={{
              width: ball.radius * 2,
              height: ball.radius * 2,
            }}
            onMouseDown={(e) => handleBallMouseDown(ball, e)}
          />
        ))}
      </div>

      {/* Building on the right side */}
      <div ref={buildingRef} className="absolute right-16 top-1/2 transform -translate-y-1/2">
        <div className="grid grid-cols-10 gap-0">
          {cubes.map((cube) => (
            <div
              key={cube.id}
              className={`w-4 h-4 border border-gray-600 transition-opacity duration-300 ${
                cube.visible ? 'bg-gray-800 opacity-100' : 'opacity-0'
              }`}
              style={{
                gridColumn: cube.x + 1,
                gridRow: cube.y + 1,
              }}
            />
          ))}
        </div>
      </div>

      {/* Dragged Ball */}
      {draggedBall && dragPosition && (
        <div
          className="absolute bg-black rounded-full pointer-events-none z-40"
          style={{
            width: draggedBall.radius * 2,
            height: draggedBall.radius * 2,
            left: dragPosition.x - draggedBall.radius,
            top: dragPosition.y - draggedBall.radius,
          }}
        />
      )}
    </div>
  );
};

export default ExploderGame;