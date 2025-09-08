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

  const handleLongPress = (id: string) => {
    const timer = setTimeout(() => {
      setIsReordering(true);
      onLongPress?.(id);
      // Disable page refresh during reordering
      document.body.style.overscrollBehavior = 'none';
      document.body.style.touchAction = 'none';
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
    // Re-enable page refresh
    document.body.style.overscrollBehavior = 'auto';
    document.body.style.touchAction = 'auto';
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
      <div className={`grid grid-cols-2 gap-4 ${isReordering ? 'pointer-events-none' : ''}`}>
        {orderedItems.map((item, index) => (
          <div
            key={item.id}
            className={`
              relative p-4 bg-card hover:bg-accent cursor-pointer
              border border-border flex flex-col items-center text-center space-y-3
              transition-all duration-300 ease-in-out
              ${isReordering 
                ? 'animate-pulse scale-105 shadow-lg pointer-events-auto' 
                : 'hover:scale-102'
              }
            `}
            onClick={() => {
              if (!isReordering) {
                item.onClick();
              }
            }}
            onMouseDown={() => handleLongPress(item.id)}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={() => handleLongPress(item.id)}
            onTouchEnd={handleEnd}
            onTouchCancel={handleEnd}
            draggable={isReordering}
            onDragStart={(e) => {
              if (!isReordering) {
                e.preventDefault();
                return;
              }
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
              if (fromIndex !== index) {
                moveItem(fromIndex, index);
              }
              exitReorderMode();
            }}
          >
            <div className="text-primary">
              {item.icon}
            </div>
            <span className="text-sm font-medium text-foreground whitespace-pre-line">
              {item.title}
            </span>
            {isReordering && (
              <div className="absolute inset-0 bg-primary/10 border-2 border-primary animate-pulse" />
            )}
          </div>
        ))}
      </div>
      {isReordering && (
        <div className="fixed inset-0 bg-black/20 z-40 flex items-center justify-center">
          <div className="bg-card p-4 shadow-lg">
            <p className="text-foreground text-center">Drag tiles to reorder</p>
            <button 
              className="mt-2 w-full bg-primary text-primary-foreground p-2"
              onClick={exitReorderMode}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReorderableTilesLogic;