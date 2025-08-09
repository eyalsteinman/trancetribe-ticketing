import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface DotCircleGameProps {
  onBack: () => void;
  adminId: string;
  adminNickname: string;
}

interface Dot {
  id: number;
  x: number;
  y: number;
  circled: boolean;
}

const DotCircleGame = ({ onBack, adminId, adminNickname }: DotCircleGameProps) => {
  const [backgroundColor, setBackgroundColor] = useState('#3b82f6');
  const [currentDot, setCurrentDot] = useState<Dot | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<{ nickname: string; score: number } | null>(null);
  const [dotCounter, setDotCounter] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [path, setPath] = useState<Array<{x: number, y: number}>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Change background color every 10 seconds
    const colorInterval = setInterval(() => {
      const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setBackgroundColor(randomColor);
    }, 10000);

    // Generate first dot
    generateNewDot();

    // Load high score from localStorage
    loadHighScore();

    return () => clearInterval(colorInterval);
  }, []);

  const generateNewDot = () => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Generate dot position with some margin from edges
    const margin = 50;
    const x = Math.random() * (containerRect.width - margin * 2) + margin;
    const y = Math.random() * (containerRect.height - margin * 2) + margin;
    
    setCurrentDot({
      id: dotCounter + 1,
      x,
      y,
      circled: false
    });
    setDotCounter(prev => prev + 1);
  };

  const loadHighScore = () => {
    try {
      const savedScore = localStorage.getItem('dot_circle_high_score');
      if (savedScore) {
        setHighScore(JSON.parse(savedScore));
      }
    } catch (error) {
      console.error('Error loading high score:', error);
    }
  };

  const saveScore = (finalScore: number) => {
    try {
      // Check if this is a new high score
      if (!highScore || finalScore > highScore.score) {
        const newHighScore = {
          nickname: adminNickname,
          score: finalScore
        };
        
        setHighScore(newHighScore);
        localStorage.setItem('dot_circle_high_score', JSON.stringify(newHighScore));
      }
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDrawing(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setPath([{ x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const newPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setPath(prev => [...prev, newPoint]);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentDot || path.length < 3) {
      setIsDrawing(false);
      setPath([]);
      return;
    }

    // Check if the dot is inside the drawn circle
    const dotCircled = isPointInPolygon(currentDot, path);
    
    if (dotCircled) {
      const newScore = score + 1;
      setScore(newScore);
      generateNewDot();
      
      // Save score every 5 dots
      if (newScore % 5 === 0) {
        saveScore(newScore);
      }
    }
    
    setIsDrawing(false);
    setPath([]);
  };

  const isPointInPolygon = (dot: Dot, polygon: Array<{x: number, y: number}>) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i].y > dot.y) !== (polygon[j].y > dot.y)) &&
          (dot.x < (polygon[j].x - polygon[i].x) * (dot.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
        inside = !inside;
      }
    }
    return inside;
  };

  const handleExit = () => {
    if (score > 0) {
      saveScore(score);
    }
    onBack();
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen w-full relative transition-colors duration-500 overflow-hidden"
      style={{ backgroundColor }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsDrawing(false);
        setPath([]);
      }}
    >
      {/* Exit button */}
      <Button 
        variant="outline"
        onClick={handleExit}
        className="absolute top-4 left-4 flex items-center gap-2 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 z-10"
      >
        <ArrowLeft className="h-4 w-4" />
        Exit
      </Button>

      {/* High score display */}
      {highScore && (
        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-lg z-10">
          <div className="text-xs opacity-75">High Score</div>
          <div className="font-bold">{highScore.nickname}: {highScore.score}</div>
        </div>
      )}

      {/* Current score */}
      <div className="absolute top-20 left-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-lg z-10">
        <div className="text-xs opacity-75">Your Score</div>
        <div className="font-bold text-lg">{score}</div>
      </div>

      {/* Current dot */}
      {currentDot && (
        <div
          className="absolute w-3 h-3 bg-white rounded-full shadow-lg z-20"
          style={{
            left: currentDot.x - 6,
            top: currentDot.y - 6,
          }}
        />
      )}

      {/* Drawing path */}
      {path.length > 1 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
          <path
            d={`M ${path[0].x} ${path[0].y} ${path.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}`}
            stroke="white"
            strokeWidth="2"
            fill="none"
            opacity="0.7"
          />
        </svg>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-lg text-center z-10">
        <div className="text-sm">Circle the white dot with your mouse to score points!</div>
      </div>
    </div>
  );
};

export default DotCircleGame;