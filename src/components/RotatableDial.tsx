import React, { useState, useRef, useCallback } from 'react';

interface Tile {
  id: string;
  title: string;
  action: () => void;
}

interface RotatableDialProps {
  tiles: Tile[];
  onTileSelect: (tile: Tile) => void;
}

const RotatableDial: React.FC<RotatableDialProps> = ({ tiles, onTileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [currentTileIndex, setCurrentTileIndex] = useState(0);
  const dialRef = useRef<HTMLDivElement>(null);
  const lastAngleRef = useRef(0);

  const dialSize = 120; // ~3cm diameter
  const dotCount = tiles.length;
  const angleStep = 360 / dotCount;

  const calculateAngle = useCallback((clientX: number, clientY: number) => {
    if (!dialRef.current) return 0;
    
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    
    return Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    lastAngleRef.current = calculateAngle(e.clientX, e.clientY);
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const currentAngle = calculateAngle(e.clientX, e.clientY);
    const angleDiff = currentAngle - lastAngleRef.current;
    
    // Handle angle wrap-around
    let adjustedDiff = angleDiff;
    if (adjustedDiff > 180) adjustedDiff -= 360;
    if (adjustedDiff < -180) adjustedDiff += 360;
    
    const newRotation = rotation + adjustedDiff;
    setRotation(newRotation);
    lastAngleRef.current = currentAngle;
    
    // Calculate which tile the arrow is pointing to
    const normalizedAngle = ((newRotation % 360) + 360) % 360;
    const tileIndex = Math.round(normalizedAngle / angleStep) % dotCount;
    setCurrentTileIndex(tileIndex);
  };

  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false);
      // Snap to nearest position
      const snapAngle = currentTileIndex * angleStep;
      setRotation(snapAngle);
      
      // Execute the tile action
      onTileSelect(tiles[currentTileIndex]);
    }
  };

  const renderDots = () => {
    return tiles.map((_, index) => {
      const angle = (index * angleStep) * (Math.PI / 180);
      const dotRadius = dialSize / 2 - 10;
      const x = Math.cos(angle - Math.PI / 2) * dotRadius;
      const y = Math.sin(angle - Math.PI / 2) * dotRadius;
      
      return (
        <div
          key={index}
          className="absolute w-2 h-2 bg-white rounded-full opacity-70"
          style={{
            left: `calc(50% + ${x}px - 4px)`,
            top: `calc(50% + ${y}px - 4px)`,
          }}
        />
      );
    });
  };

  return (
    <div className="flex flex-col items-center mt-32">
      {/* Current Tile Display */}
      <div className="text-center mb-12">
        <h1 className="text-white text-4xl font-bold opacity-80 transition-all duration-300">
          {tiles[currentTileIndex]?.title}
        </h1>
      </div>

      {/* Dial Container */}
      <div className="relative mb-8">
        {/* Dots around the dial */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{ width: dialSize, height: dialSize }}
        >
          {renderDots()}
        </div>

        {/* Glass Dial */}
        <div
          ref={dialRef}
          className={`relative cursor-pointer select-none transition-all duration-200 backdrop-blur-md bg-white/10 border border-white/20 shadow-lg rounded-full ${
            isDragging 
              ? 'bg-green-500/20 border-green-400/40 scale-110' 
              : 'hover:bg-white/15'
          }`}
          style={{ 
            width: dialSize, 
            height: dialSize,
            transform: `rotate(${rotation}deg)`,
            touchAction: 'none',
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {/* Arrow pointing upward */}
          <div 
            className="absolute top-2 left-1/2 transform -translate-x-1/2"
            style={{ 
              width: 0, 
              height: 0, 
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: '10px solid white',
            }}
          />
        </div>
      </div>

      {/* Navigation Instructions */}
      <div className="text-center">
        <p className="text-white text-sm opacity-70">
          spin navigation
        </p>
      </div>
    </div>
  );
};

export default RotatableDial;