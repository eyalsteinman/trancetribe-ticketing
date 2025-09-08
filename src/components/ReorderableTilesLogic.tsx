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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    // Load saved order from localStorage
    const savedOrder = localStorage.getItem(orderKey);
    if (savedOrder) {
      try {
        const orderIds = JSON.parse(savedOrder);
        const reorderedItems = orderIds
          .map((id: string) => items.find(item => item.id === id))
          .filter(Boolean)
          .concat(items.filter(item => !orderIds.includes(item.id)));
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
      onLongPress?.(id);
      // Disable page refresh during reordering
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
    setDraggedIndex(null);
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

  return (
    <div className="container-section">
      <div className="grid grid-cols-2 gap-4">
        {orderedItems.map((item, index) => (
          <div
            key={item.id}
            className={`
              relative p-4 bg-card hover:bg-accent cursor-pointer
              border border-border flex flex-col items-center text-center space-y-3
              transition-all duration-200 ease-out
              ${isReordering 
                ? 'tile-reordering pointer-events-auto' 
                : 'hover:scale-102'
              }
              ${draggedIndex === index ? 'tile-dragging' : ''}
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
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={(e) => {
              if (!isReordering) {
                handleLongPress(item.id, e);
              }
            }}
            onTouchEnd={handleEnd}
            onTouchCancel={handleEnd}
            draggable={isReordering}
            onDragStart={(e) => {
              if (!isReordering) {
                e.preventDefault();
                return;
              }
              setDraggedIndex(index);
              e.dataTransfer.setData('text/plain', index.toString());
              e.currentTarget.style.opacity = '0.5';
            }}
            onDragEnd={(e) => {
              e.currentTarget.style.opacity = '1';
              setDraggedIndex(null);
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
            }}
          >
            <div className="text-primary">
              {item.icon}
            </div>
            <span className="text-sm font-medium text-foreground whitespace-pre-line">
              {item.title}
            </span>
            {isReordering && (
              <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs px-1 animate-pulse">
                Drag to reorder
              </div>
            )}
          </div>
        ))}
      </div>
      {isReordering && (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-card border border-border p-4 animate-slide-up">
          <p className="text-foreground text-center text-sm mb-2">Drag tiles to reorder them</p>
          <button 
            className="w-full bg-primary text-primary-foreground p-2 font-medium"
            onClick={exitReorderMode}
          >
            Done Reordering
          </button>
        </div>
      )}
    </div>
  );
};

export default ReorderableTilesLogic;