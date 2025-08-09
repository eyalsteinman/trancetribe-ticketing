import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface ExploderGameProps {
  onBack: () => void;
}

interface Ball {
  id: string;
  size: 'large' | 'medium' | 'small';
  radius: number;
  selected: boolean;
}

interface Cube {
  id: string;
  x: number;
  y: number;
  visible: boolean;
}

const ExploderGame = ({ onBack }: ExploderGameProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedBall, setSelectedBall] = useState<Ball | null>(null);
  const [showDropButton, setShowDropButton] = useState(false);

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

  const handleBallClick = (ball: Ball) => {
    setSelectedBall(ball);
    setShowDropButton(true);
  };

  const handleDrop = () => {
    if (!selectedBall) return;

    // Calculate crater size based on ball size
    let craterRadius: number;
    switch (selectedBall.size) {
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

    // Create crater in the center of the building
    const centerX = 5;
    const centerY = 7;

    setCubes(prevCubes => 
      prevCubes.map(cube => {
        const distance = Math.sqrt(
          Math.pow(cube.x - centerX, 2) + Math.pow(cube.y - centerY, 2)
        );
        
        if (distance <= craterRadius) {
          return { ...cube, visible: false };
        }
        return cube;
      })
    );

    setSelectedBall(null);
    setShowDropButton(false);
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: '#3b82f6' }}
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
        {balls.map((ball, index) => (
          <div
            key={ball.id}
            className={`bg-black rounded-full cursor-pointer transition-all duration-200 ${
              selectedBall?.id === ball.id ? 'ring-4 ring-white' : 'hover:scale-110'
            }`}
            style={{
              width: ball.radius * 2,
              height: ball.radius * 2,
            }}
            onClick={() => handleBallClick(ball)}
          />
        ))}
      </div>

      {/* Building on the right side */}
      <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
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

      {/* Drop Button */}
      {showDropButton && selectedBall && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
          <Button
            onClick={handleDrop}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-lg font-bold shadow-xl"
          >
            DROP
          </Button>
        </div>
      )}
    </div>
  );
};

export default ExploderGame;