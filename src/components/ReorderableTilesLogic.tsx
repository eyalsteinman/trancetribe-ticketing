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

  const handleMouseDown = (id: string) => {
    const timer = setTimeout(() => {
      setIsReordering(true);
      onLongPress?.(id);
    }, 800); // 800ms long press
    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleTouchStart = (id: string) => {
    const timer = setTimeout(() => {
      setIsReordering(true);
      onLongPress?.(id);
    }, 800);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...orderedItems];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setOrderedItems(newItems);
    saveOrder(newItems);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {orderedItems.map((item, index) => (
        <div
          key={item.id}
          className={`
            relative p-4 bg-card hover:bg-accent transition-colors duration-200 cursor-pointer
            border border-border rounded-none shadow-none
            flex flex-col items-center text-center space-y-3
          `}
          onClick={() => {
            if (!isReordering) {
              item.onClick();
            }
          }}
          onMouseDown={() => handleMouseDown(item.id)}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={() => handleTouchStart(item.id)}
          onTouchEnd={handleTouchEnd}
          draggable={isReordering}
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', index.toString());
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            if (fromIndex !== index) {
              moveItem(fromIndex, index);
            }
            setIsReordering(false);
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
  );
};

export default ReorderableTilesLogic;