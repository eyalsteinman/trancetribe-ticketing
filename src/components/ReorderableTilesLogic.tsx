import React, { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TileItem {
  id: string;
  title: string | React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  notificationCount?: number;
  displayCount?: number;
}

interface ReorderableTilesLogicProps {
  items: TileItem[];
  orderKey: string;
  onLongPress?: (id: string) => void;
}

// Simple array move helper
const arrayMove = <T,>(array: T[], from: number, to: number) => {
  const newArray = array.slice();
  const [item] = newArray.splice(from, 1);
  newArray.splice(to, 0, item);
  return newArray;
};

const SortableTile: React.FC<{
  item: TileItem;
  index: number;
  isReordering: boolean;
  tiltedTileId: string | null;
  onTileClick: () => void;
}> = ({ item, index, isReordering, tiltedTileId, onTileClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const [isPressed, setIsPressed] = React.useState(false);
  const [isScrolling, setIsScrolling] = React.useState(false);
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout>();

  const randomDelay = React.useMemo(() => Math.random() * 4, []);
  
  const tileStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isReordering ? 'grab' : 'pointer',
    ...((!isPressed && !isReordering) ? {
      backgroundImage: `linear-gradient(
        90deg,
        transparent,
        hsl(280 80% 60% / 0.3) 50%,
        transparent
      )`,
      backgroundSize: '200% 100%',
      animation: `border-trace 3s linear infinite, neon-glow 4s ease-in-out infinite`,
      animationDelay: `${randomDelay}s, ${randomDelay}s`,
    } : {}),
  };

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handlePress = () => {
    if (!isReordering && !isScrolling) {
      setIsPressed(true);
    }
  };

  const handleRelease = () => {
    if (isPressed && !isReordering && !isScrolling) {
      setIsPressed(false);
      setTimeout(() => onTileClick(), 100);
    } else {
      setIsPressed(false);
    }
  };

  const handleMouseDown = isReordering ? undefined : handlePress;
  const handleMouseUp = isReordering ? undefined : handleRelease;
  const handleTouchStart = isReordering ? undefined : handlePress;
  const handleTouchEnd = isReordering ? undefined : handleRelease;

  return (
    <div
      ref={setNodeRef}
      data-tile="true"
      data-index={index}
      data-id={item.id}
      style={tileStyle}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => !isReordering && setIsPressed(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => !isReordering && setIsPressed(false)}
      className={`
        relative p-4 select-none h-32 min-h-32 rounded-lg
        border-2 flex flex-col items-center justify-center text-center space-y-1
        transition-all duration-200 ease-out overflow-hidden
        ${!isReordering ? 'hover:scale-102' : ''}
        ${tiltedTileId === item.id ? 'animate-[tilt_0.3s_ease-in-out] rotate-12' : ''}
        ${isDragging ? 'z-10' : ''}
        ${isPressed 
          ? 'bg-[hsl(280_80%_60%)] border-[hsl(280_80%_60%)] shadow-[0_0_30px_hsl(280_80%_60%)]' 
          : 'bg-card border-[hsl(280_80%_60%/0.3)]'
        }
      `}
      {...(isReordering ? { ...attributes, ...listeners } : {})}
    >
      <div className={`transition-colors duration-200 ${isPressed ? 'text-primary-foreground' : 'text-primary'}`}>
        {item.icon}
      </div>
      <span className={`text-sm font-medium whitespace-pre-line transition-colors duration-200 ${isPressed ? 'text-primary-foreground' : 'text-foreground'}`}>
        {item.title}
      </span>
      {item.displayCount !== undefined && (
        <div className={`text-lg font-bold transition-colors duration-200 ${isPressed ? 'text-primary-foreground' : 'text-primary'}`}>
          {item.displayCount}
        </div>
      )}
      {item.notificationCount !== undefined && item.notificationCount > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-6 h-6 flex items-center justify-center font-bold">
          {item.notificationCount}
        </div>
      )}
    </div>
  );
};

const ReorderableTilesLogic = ({ items, orderKey, onLongPress }: ReorderableTilesLogicProps) => {
  const [orderedItems, setOrderedItems] = useState<TileItem[]>(items);
  const [isReordering, setIsReordering] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [tiltedTileId, setTiltedTileId] = useState<string | null>(null);

  useEffect(() => {
    // Load saved order from localStorage
    const savedOrder = localStorage.getItem(orderKey);
    if (savedOrder) {
      try {
        const orderIds: string[] = JSON.parse(savedOrder);
        const mapped = orderIds
          .map((id: string) => items.find(item => item.id === id))
          .filter((x): x is TileItem => Boolean(x));
        const reorderedItems = mapped.concat(
          items.filter(item => !orderIds.includes(item.id))
        );
        setOrderedItems(reorderedItems);
      } catch {
        setOrderedItems(items);
      }
    } else {
      setOrderedItems(items);
    }
  }, [items, orderKey]);

  const saveOrder = (newOrder: TileItem[]) => {
    const orderIds = newOrder.map(item => item.id);
    localStorage.setItem(orderKey, JSON.stringify(orderIds));
  };

  const handleLongPress = (id: string, e: React.TouchEvent | React.MouseEvent) => {
    if (isReordering) return;

    const timer = setTimeout(() => {
      setIsReordering(true);
      setTiltedTileId(id);
      onLongPress?.(id);
      // Disable page scroll during reordering
      document.body.classList.add('no-refresh', 'hide-scrollbar');
      document.body.style.overflow = 'hidden';
    }, 3000); // 3 second long press
    setLongPressTimer(timer as unknown as NodeJS.Timeout);
  };

  const handleEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const exitReorderMode = () => {
    setIsReordering(false);
    setTiltedTileId(null);
    // Re-enable page refresh and scrolling
    document.body.classList.remove('no-refresh', 'hide-scrollbar');
    document.body.style.overflow = 'auto';
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const itemIds = useMemo(() => orderedItems.map(it => it.id), [orderedItems]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!active?.id || !over?.id || active.id === over.id) {
      exitReorderMode();
      return;
    }

    const oldIndex = orderedItems.findIndex(i => i.id === active.id);
    const newIndex = orderedItems.findIndex(i => i.id === over.id);

    if (oldIndex !== newIndex && oldIndex >= 0 && newIndex >= 0) {
      const newItems = arrayMove(orderedItems, oldIndex, newIndex);
      setOrderedItems(newItems);
      saveOrder(newItems);
    }

    // Exit reordering mode after drop
    exitReorderMode();
  };

  return (
    <div className="container-section">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-2 gap-4">
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {orderedItems.map((item, index) => (
              <div
                key={item.id}
                onMouseDown={(e) => {
                  if (!isReordering) {
                    handleLongPress(item.id, e);
                  }
                }}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={(e) => {
                  if (!isReordering) {
                    handleLongPress(item.id, e);
                  }
                }}
                onTouchEnd={(e) => {
                  handleEnd();
                  if (isReordering) {
                    // Let onDragEnd handle exit when a drop occurs
                    // If user taps without dragging, exit immediately
                    exitReorderMode();
                  }
                }}
                onTouchCancel={handleEnd}
              >
                <SortableTile
                  item={item}
                  index={index}
                  isReordering={isReordering}
                  tiltedTileId={tiltedTileId}
                  onTileClick={() => item.onClick()}
                />
              </div>
            ))}
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
};

export default ReorderableTilesLogic;
