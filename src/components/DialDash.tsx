import React, { useState, useRef, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface DialDashProps {
  user: User;
  isAdmin: boolean;
  onBack: () => void;
  tiles: Array<{
    id: string;
    title: string;
    onClick: () => void;
  }>;
}

const DialDash = ({ user, isAdmin, onBack, tiles }: DialDashProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dialRotation, setDialRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTile, setSelectedTile] = useState('');
  const [isReordering, setIsReordering] = useState(false);
  const [reorderableTiles, setReorderableTiles] = useState(tiles);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [slideDownActive, setSlideDownActive] = useState(false);
  
  const dialRef = useRef<HTMLDivElement>(null);
  const startAngleRef = useRef(0);
  const startRotationRef = useRef(0);
  const dragStartYRef = useRef(0);
  
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // Calculate dots around the dial (360 degrees / number of tiles)
  const angleStep = 360 / tiles.length;
  const dotPositions = tiles.map((_, index) => {
    const angle = index * angleStep;
    return {
      angle,
      x: 50 + 45 * Math.cos((angle - 90) * Math.PI / 180), // -90 to start at top
      y: 50 + 45 * Math.sin((angle - 90) * Math.PI / 180),
    };
  });

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      if (error && !error.message.includes('Session not found')) {
        console.error('Sign out error:', error);
        toast({
          title: t('warning'),
          description: t('logged_out_locally_server_failed'),
          variant: "destructive"
        });
      } else {
        toast({
          title: t('success'),
          description: t('signed_out_successfully'),
        });
      }
    } catch (error) {
      console.error('Sign out catch error:', error);
      toast({
        title: t('info'), 
        description: t('logged_out_locally'),
      });
    }
  };

  const getDialCenter = () => {
    if (!dialRef.current) return { x: 0, y: 0 };
    const rect = dialRef.current.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  };

  const getAngleFromPoint = (clientX: number, clientY: number) => {
    const center = getDialCenter();
    const deltaX = clientX - center.x;
    const deltaY = clientY - center.y;
    return Math.atan2(deltaY, deltaX) * 180 / Math.PI;
  };

  const normalizeAngle = (angle: number) => {
    return ((angle % 360) + 360) % 360;
  };

  const getCurrentTileIndex = () => {
    const normalizedRotation = normalizeAngle(dialRotation + 90); // +90 because we start at top
    const tileIndex = Math.round(normalizedRotation / angleStep) % tiles.length;
    return tileIndex;
  };

  const handleDialStart = (clientX: number, clientY: number, startY: number) => {
    setIsDragging(true);
    setSlideDownActive(false);
    startAngleRef.current = getAngleFromPoint(clientX, clientY);
    startRotationRef.current = dialRotation;
    dragStartYRef.current = startY;
  };

  const handleDialMove = (clientX: number, clientY: number, currentY: number) => {
    if (!isDragging) return;

    // Check for slide down gesture
    const slideDistance = currentY - dragStartYRef.current;
    if (slideDistance > 50) {
      setSlideDownActive(true);
      return;
    }

    if (slideDownActive) return;

    const currentAngle = getAngleFromPoint(clientX, clientY);
    const angleDelta = currentAngle - startAngleRef.current;
    const newRotation = startRotationRef.current + angleDelta;
    
    setDialRotation(newRotation);
    
    // Update selected tile based on current rotation
    const currentTileIndex = getCurrentTileIndex();
    setSelectedTile(tiles[currentTileIndex]?.title || '');
  };

  const handleDialEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (slideDownActive) {
      setSlideDownActive(false);
      setSelectedTile('');
      return;
    }

    // Navigate to selected tile
    const currentTileIndex = getCurrentTileIndex();
    const selectedTileData = tiles[currentTileIndex];
    if (selectedTileData) {
      selectedTileData.onClick();
    }
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDialStart(e.clientX, e.clientY, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleDialMove(e.clientX, e.clientY, e.clientY);
  };

  const handleMouseUp = () => {
    handleDialEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleDialStart(touch.clientX, touch.clientY, touch.clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleDialMove(touch.clientX, touch.clientY, touch.clientY);
  };

  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    handleDialEnd();
  };

  useEffect(() => {
    if (isDragging) {
      const handleMove = (e: Event) => {
        if (e instanceof MouseEvent) {
          handleMouseMove(e);
        } else if (e instanceof TouchEvent) {
          handleTouchMove(e);
        }
      };

      const handleEnd = (e: Event) => {
        if (e instanceof MouseEvent) {
          handleMouseUp();
        } else if (e instanceof TouchEvent) {
          handleTouchEnd(e);
        }
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd, { passive: false });

      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDragging, slideDownActive]);

  // Handle long press for reordering
  const handleMenuItemMouseDown = (index: number) => {
    const timer = setTimeout(() => {
      setIsReordering(true);
    }, 2000);
    setLongPressTimer(timer);
  };

  const handleMenuItemMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newTiles = [...reorderableTiles];
    const [draggedTile] = newTiles.splice(draggedIndex, 1);
    newTiles.splice(dropIndex, 0, draggedTile);

    setReorderableTiles(newTiles);
    setDraggedIndex(null);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-400/5 rounded-full blur-2xl animate-ping delay-500" />
      </div>

      {/* Top navigation */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-50">
        {/* Hamburger menu */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMenuOpen(true)}
          className="text-white hover:bg-white/10 transition-colors"
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Logout button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={async () => {
            await handleSignOut();
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }}
          className="text-white hover:bg-white/10 transition-colors"
        >
          <LogOut className="h-6 w-6" />
        </Button>
      </div>

      {/* Selected tile name in center */}
      {selectedTile && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
          <h2 className="text-3xl font-bold text-white text-center animate-fade-in">
            {selectedTile}
          </h2>
        </div>
      )}

      {/* Slide down to cancel hint */}
      {isDragging && slideDownActive && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
          <h2 className="text-2xl font-bold text-red-300 text-center animate-pulse">
            Release to Cancel
          </h2>
        </div>
      )}

      {/* Dial container */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
        {/* Dial */}
        <div className="relative">
          {/* White dots around the dial */}
          {dotPositions.map((dot, index) => (
            <div
              key={index}
              className="absolute w-3 h-3 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${dot.x}%`,
                top: `${dot.y}%`,
              }}
            />
          ))}

          {/* Dial */}
          <div
            ref={dialRef}
            className="w-64 h-64 rounded-full backdrop-blur-md bg-black/40 border border-white/20 cursor-grab active:cursor-grabbing transition-all duration-200 hover:bg-black/50 flex items-center justify-center select-none"
            style={{
              transform: `rotate(${dialRotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {/* Arrow pointer */}
            <div className="absolute top-4 w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-white" />
          </div>
        </div>

        {/* Labels */}
        <div className="mt-4 text-center">
          <p className="text-white font-semibold text-lg mb-1">dial navigation</p>
          <p className="text-white/60 text-sm">slide down to cancel</p>
        </div>
      </div>

      {/* Sliding menu */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-black/80 backdrop-blur-lg border-r border-white/20 transform transition-transform duration-300 ease-out z-50 ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4">
          {/* Menu header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white text-xl font-bold">Navigation</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(false)}
              className="text-white hover:bg-white/10"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Back to tile dash button */}
          <Button
            onClick={onBack}
            className="w-full mb-4 bg-purple-600 hover:bg-purple-700 text-white"
          >
            back to tile dash
          </Button>

          {/* Menu items */}
          <div className="space-y-2">
            {(isReordering ? reorderableTiles : tiles).map((tile, index) => (
              <div
                key={tile.id}
                className={`p-3 rounded-lg text-white hover:bg-white/10 cursor-pointer transition-colors ${
                  isReordering ? 'bg-white/5' : ''
                }`}
                onMouseDown={() => !isReordering && handleMenuItemMouseDown(index)}
                onMouseUp={handleMenuItemMouseUp}
                onMouseLeave={handleMenuItemMouseUp}
                onClick={() => !isReordering && tile.onClick()}
                draggable={isReordering}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
              >
                <span className="font-medium">{tile.title}</span>
                {isReordering && (
                  <span className="text-xs text-white/60 ml-2">(drag to reorder)</span>
                )}
              </div>
            ))}
          </div>

          {/* Reordering controls */}
          {isReordering && (
            <div className="mt-4 space-y-2">
              <Button
                onClick={() => {
                  setIsReordering(false);
                  // Save reordered tiles if needed
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Done Reordering
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Menu overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default DialDash;