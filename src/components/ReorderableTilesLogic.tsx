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
  title: string | string[];
  icon: React.ReactNode;
  onClick: () => void;
  notificationCount?: number;
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

  const tileStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    backdropFilter: 'blur(10px)',
    cursor: isReordering ? 'grab' : 'pointer',
  };

  return (
    <div
      ref={setNodeRef}
      data-tile="true"
      data-index={index}
      data-id={item.id}
      style={tileStyle}
      className={`
        flex flex-col items-center justify-center p-6 rounded-xl bg-purple-800/30 text-white shadow-2xl transition-all hover:bg-purple-700/50 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-white/20 select-none
        ${!isReordering ? 'hover:scale-102' : ''}
        ${tiltedTileId === item.id ? 'animate-[tilt_0.3s_ease-in-out] rotate-12' : ''}
        ${isDragging ? 'z-10' : ''}
      `}
      onClick={() => {
        if (!isReordering) onTileClick();
      }}
      {...(isReordering ? { ...attributes, ...listeners } : {})}
    >
      <div className="mb-2">
        {item.icon}
      </div>
      <span className="text-sm font-semibold text-center leading-tight text-white">
        {Array.isArray(item.title) ? (
          item.title.map((line, lineIndex) => (
            <React.Fragment key={lineIndex}>
              {line}
              {lineIndex < item.title.length - 1 && <br />}
            </React.Fragment>
          ))
        ) : (
          item.title
        )}
      </span>
      {item.notificationCount && item.notificationCount > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
          {item.notificationCount > 9 ? '9+' : item.notificationCount}
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
