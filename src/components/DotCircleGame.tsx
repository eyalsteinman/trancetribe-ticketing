import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useBackground } from '@/contexts/BackgroundContext';

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
  const { backgroundColor } = useBackground();
  const [currentDot, setCurrentDot] = useState<Dot | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<{ nickname: string; score: number } | null>(null);
  const [dotCounter, setDotCounter] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [path, setPath] = useState<Array<{x: number, y: number}>>([]);
  const [showInstructions, setShowInstructions] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [centerMessage, setCenterMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load high score from localStorage
    loadHighScore();
  }, []);

  useEffect(() => {
    // Generate first dot only when game starts
    if (gameStarted) {
      generateNewDot();
    }
  }, [gameStarted]);

  const generateNewDot = () => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Generate dot position with proper padding from edges and UI elements
    // 60px from edges, extra padding for UI elements
    const edgePadding = 60;
    const topPadding = 120; // Extra space for scores at top
    const leftPadding = 120; // Extra space for back button
    
    const x = Math.random() * (containerRect.width - leftPadding - edgePadding) + leftPadding;
    const y = Math.random() * (containerRect.height - topPadding - edgePadding) + topPadding;
    
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

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      let clientX, clientY;
      if ('touches' in e) {
        // Touch event
        if (e.touches.length !== 1) return; // Only allow single finger
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        // Mouse event
        clientX = e.clientX;
        clientY = e.clientY;
      }
      setPath([{ x: clientX - rect.left, y: clientY - rect.top }]);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !containerRef.current) return;
    e.preventDefault();
    
    const rect = containerRef.current.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      // Touch event
      if (e.touches.length !== 1) return; // Only allow single finger
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const newPoint = { x: clientX - rect.left, y: clientY - rect.top };
    setPath(prev => [...prev, newPoint]);
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
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

      // Messages
      if (newScore % 10 === 0) {
        setCenterMessage('fuckinshit');
        setTimeout(() => setCenterMessage(null), 2000);
      } else if (newScore % 3 === 0) {
        const words = ['Awesome', 'Great', 'Nice', 'Bravo', 'Cool', 'Super'];
        setCenterMessage(words[Math.floor(Math.random() * words.length)]);
        setTimeout(() => setCenterMessage(null), 2000);
      }
      
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

  const startGame = () => {
    setShowInstructions(false);
    setGameStarted(true);
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen w-full relative transition-colors duration-500 overflow-hidden"
      style={{ backgroundColor }}
      {...(gameStarted && !showInstructions ? {
        onMouseDown: handleStart,
        onMouseMove: handleMove,
        onMouseUp: handleEnd,
        onTouchStart: handleStart,
        onTouchMove: handleMove,
        onTouchEnd: handleEnd,
        onMouseLeave: () => {
          setIsDrawing(false);
          setPath([]);
        },
        style: { backgroundColor, touchAction: 'none' }
      } : { style: { backgroundColor } })}
    >
      {/* Exit button */}
      <div 
        className="absolute top-4 left-4 z-[9999]"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
      >
        <Button 
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleExit();
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Scores aligned to right, side-by-side */}
      <div className="absolute top-4 right-4 flex flex-col items-end z-40 text-right text-white">
        <div className="flex items-baseline gap-4">
          <div>
            <div className="text-xs opacity-75">Your Score</div>
            <div className="font-bold text-lg">{score}</div>
          </div>
          <div>
            <div className="text-xs opacity-75">High Score</div>
            <div className="font-bold text-lg">{highScore?.score ?? 0}</div>
          </div>
        </div>
        {highScore?.nickname && (
          <div className="text-xs opacity-75 mt-1">{highScore.nickname}</div>
        )}
      </div>

      {/* Instructions popup */}
      {showInstructions && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 text-white p-6 rounded-lg text-center max-w-sm mx-4">
            <div>
              <h3 className="text-lg font-bold mb-2">Dot Circle Game</h3>
              <p className="text-sm mb-4">Use one finger to circle the white dot and score points!</p>
              <Button 
                onClick={startGame}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/20"
              >
                Start Game
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Current dot - only show when game started */}
      {currentDot && gameStarted && !showInstructions && (
        <div
          className="absolute w-3 h-3 bg-white rounded-full shadow-lg z-20"
          style={{
            left: currentDot.x - 6,
            top: currentDot.y - 6,
          }}
        />
      )}

      {/* Drawing path - only show when game started */}
      {path.length > 1 && gameStarted && !showInstructions && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
          <path
            d={`M ${path[0].x} ${path[0].y} ${path.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}`}
            stroke="white"
            strokeWidth="1"
            fill="none"
            opacity="0.8"
          />
        </svg>
      )}

      {/* Center message overlay */}
      {centerMessage && (
        <div className="absolute inset-0 flex items-center justify-center z-[9000] pointer-events-none">
          <div className="text-white font-extrabold text-3xl drop-shadow-lg">{centerMessage}</div>
        </div>
      )}
    </div>
  );
};

export default DotCircleGame;