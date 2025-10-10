import React, { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
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
  const pressTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const randomDelay = React.useMemo(() => Math.random() * 4, []);
  
  const tileStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isDragging ? 'grabbing' : 'pointer',
    borderRadius: '0.5rem',
    ...(!isPressed && !isDragging && !isReordering ? {
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

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only handle visual feedback for quick taps, not during drag
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      setIsPressed(true);
      pressTimerRef.current = setTimeout(() => {
        setIsPressed(false);
      }, 3000); // Match TouchSensor delay
    } else {
      // For mouse, show immediate feedback
      setIsPressed(true);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setIsPressed(false);
    
    // Only trigger click if not dragging
    if (!isDragging && !isReordering) {
      onTileClick();
    }
  };

  const handlePointerCancel = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setIsPressed(false);
  };

  React.useEffect(() => {
    return () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={setNodeRef}
      data-tile="true"
      data-index={index}
      data-id={item.id}
      style={tileStyle}
      className={`
        relative p-4 select-none h-32 min-h-32
        border-2 flex flex-col items-center justify-center text-center space-y-1
        transition-all duration-200 ease-out
        ${!isReordering && !isDragging ? 'hover:scale-102' : ''}
        ${tiltedTileId === item.id ? 'animate-[tilt_0.3s_ease-in-out] rotate-12' : ''}
        ${isDragging ? 'z-10 opacity-80' : ''}
        ${isPressed 
          ? 'bg-[hsl(280_80%_60%)] border-[hsl(280_80%_60%)] shadow-[0_0_30px_hsl(280_80%_60%)]' 
          : 'bg-card border-[hsl(280_80%_60%/0.3)]'
        }
      `}
      {...attributes}
      {...listeners}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div className={`transition-colors duration-200 ${isPressed || isDragging ? 'text-primary-foreground' : 'text-primary'}`}>
        {item.icon}
      </div>
      <span className={`text-sm font-medium whitespace-pre-line transition-colors duration-200 ${isPressed || isDragging ? 'text-primary-foreground' : 'text-foreground'}`}>
        {item.title}
      </span>
      {item.displayCount !== undefined && (
        <div className={`text-lg font-bold transition-colors duration-200 ${isPressed || isDragging ? 'text-primary-foreground' : 'text-primary'}`}>
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

  const exitReorderMode = () => {
    setIsReordering(false);
    setTiltedTileId(null);
    // Re-enable page refresh and scrolling
    document.body.classList.remove('no-refresh', 'hide-scrollbar');
    document.body.style.overflow = 'auto';
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 3000,
        tolerance: 10,
      },
    })
  );

  const itemIds = useMemo(() => orderedItems.map(it => it.id), [orderedItems]);

  const handleDragStart = (event: any) => {
    setIsReordering(true);
    setTiltedTileId(event.active.id);
    onLongPress?.(event.active.id);
    document.body.classList.add('no-refresh', 'hide-scrollbar');
    document.body.style.overflow = 'hidden';
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    exitReorderMode();

    if (!active?.id || !over?.id || active.id === over.id) {
      return;
    }

    const oldIndex = orderedItems.findIndex(i => i.id === active.id);
    const newIndex = orderedItems.findIndex(i => i.id === over.id);

    if (oldIndex !== newIndex && oldIndex >= 0 && newIndex >= 0) {
      const newItems = arrayMove(orderedItems, oldIndex, newIndex);
      setOrderedItems(newItems);
      saveOrder(newItems);
    }
  };

  return (
    <div className="container-section">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-2 gap-4">
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {orderedItems.map((item, index) => (
              <SortableTile
                key={item.id}
                item={item}
                index={index}
                isReordering={isReordering}
                tiltedTileId={tiltedTileId}
                onTileClick={() => !isReordering && item.onClick()}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
};

export default ReorderableTilesLogic;
