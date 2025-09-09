import React, { useState, useEffect } from 'react';

interface TileItem {
  id: string;
  title: string | React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
}

interface ReorderableTilesLogicProps {
  items: TileItem[];
  orderKey: string;
  onLongPress?: (id: string) => void;
}

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
    setLongPressTimer(timer);
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

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...orderedItems];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setOrderedItems(newItems);
    saveOrder(newItems);
  };

  const getTileIndexFromPoint = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!el) return null;
    const tileEl = el.closest('[data-tile="true"]') as HTMLElement | null;
    if (!tileEl) return null;
    const idx = tileEl.getAttribute('data-index');
    return idx ? parseInt(idx) : null;
  };

  return (
    <div className="container-section">
      <div className="grid grid-cols-2 gap-4">
        {orderedItems.map((item, index) => (
          <div
            key={item.id}
            data-tile="true"
            data-index={index}
            data-id={item.id}
            className={`
              relative p-4 bg-card cursor-pointer select-none
              border border-border flex flex-col items-center text-center space-y-3
              transition-transform duration-200 ease-out
              ${!isReordering ? 'hover:scale-102' : ''}
              ${tiltedTileId === item.id ? 'animate-[tilt_0.3s_ease-in-out] rotate-12' : ''}
            `}
            onClick={() => {
              if (!isReordering) {
                item.onClick();
              }
            }}
            onMouseDown={(e) => {
              if (!isReordering) {
                handleLongPress(item.id, e);
              }
            }}
            onMouseUp={(e) => {
              // End potential long-press
              handleEnd();
            }}
            onMouseLeave={handleEnd}
            onTouchStart={(e) => {
              if (!isReordering) {
                handleLongPress(item.id, e);
              }
            }}
            onTouchMove={(e) => {
              if (!isReordering) return;
              e.preventDefault();
              const t = e.touches[0];
              if (!t || tiltedTileId == null) return;
              const targetIndex = getTileIndexFromPoint(t.clientX, t.clientY);
              const fromIndex = orderedItems.findIndex((it) => it.id === tiltedTileId);
              if (targetIndex != null && fromIndex >= 0 && targetIndex !== fromIndex) {
                moveItem(fromIndex, targetIndex);
              }
            }}
            onTouchEnd={(e) => {
              handleEnd();
              if (isReordering) {
                exitReorderMode();
              }
            }}
            onTouchCancel={handleEnd}
            draggable={isReordering}
            onDragStart={(e) => {
              if (!isReordering) {
                e.preventDefault();
                return;
              }
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', index.toString());
            }}
            onDragOver={(e) => {
              if (isReordering) {
                e.preventDefault();
              }
            }}
            onDrop={(e) => {
              if (!isReordering) return;
              e.preventDefault();
              const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
              if (fromIndex !== index && !isNaN(fromIndex)) {
                moveItem(fromIndex, index);
              }
              exitReorderMode();
            }}
            onDragEnd={() => {
              // Ensure we exit if drop happens outside tiles
              if (isReordering) exitReorderMode();
            }}
          >
            <div className="text-primary">
              {item.icon}
            </div>
            <span className="text-sm font-medium text-foreground whitespace-pre-line">
              {item.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReorderableTilesLogic;
