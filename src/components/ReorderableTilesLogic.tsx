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
    setIsReordering(true);
    onLongPress?.(id);
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...orderedItems];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setOrderedItems(newItems);
    saveOrder(newItems);
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {orderedItems.map((item, index) => (
        <div
          key={item.id}
          className={`
            modern-tile group relative overflow-hidden cursor-pointer
            bg-gradient-to-br from-white/10 to-white/5
            border border-white/20 rounded-3xl
            p-6 text-center space-y-4
            backdrop-blur-lg shadow-2xl
            hover:shadow-[0_25px_50px_-12px_rgba(59,130,246,0.25)]
            hover:border-white/30 hover:bg-gradient-to-br hover:from-white/20 hover:to-white/10
            transform transition-all duration-500 ease-out
            hover:scale-105 hover:-translate-y-2
            active:scale-95
          `}
          onClick={() => {
            if (!isReordering) {
              item.onClick();
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            handleLongPress(item.id);
          }}
          onTouchStart={(e) => {
            const timer = setTimeout(() => handleLongPress(item.id), 600);
            const element = e.currentTarget;
            const clearTimer = () => clearTimeout(timer);
            element.addEventListener('touchend', clearTimer, { once: true });
            element.addEventListener('touchmove', clearTimer, { once: true });
          }}
          draggable={isReordering}
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', index.toString());
            e.currentTarget.style.opacity = '0.5';
          }}
          onDragEnd={(e) => {
            e.currentTarget.style.opacity = '1';
            setIsReordering(false);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onDragLeave={(e) => {
            e.currentTarget.style.transform = '';
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.transform = '';
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            if (fromIndex !== index) {
              moveItem(fromIndex, index);
            }
          }}
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Icon with glow effect */}
          <div className="relative z-10 text-4xl text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
            {item.icon}
          </div>
          
          {/* Title with enhanced typography */}
          <div className="relative z-10">
            <span className="text-base font-bold text-white drop-shadow-sm whitespace-pre-line leading-tight group-hover:text-primary/90 transition-colors duration-300">
              {item.title}
            </span>
          </div>
          
          {/* Reorder indicator */}
          {isReordering && (
            <div className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full animate-pulse" />
          )}
        </div>
      ))}
    </div>
  );
};

export default ReorderableTilesLogic;