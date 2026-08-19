import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

export interface TileItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface ReorderableTilesProps {
  items: TileItem[];
  orderKey: string; // localStorage key for persistence
}

const ReorderableTiles: React.FC<ReorderableTilesProps> = ({ items, orderKey }) => {
  const [order, setOrder] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragReadyId, setDragReadyId] = useState<string | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const prevOverflowRef = useRef<string>("");
  const prevTouchActionRef = useRef<string>("");

  // Load saved order
  useEffect(() => {
    const saved = localStorage.getItem(orderKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        if (Array.isArray(parsed)) setOrder(parsed);
      } catch {}
    }
  }, [orderKey]);

  // Persist on change
  useEffect(() => {
    if (order.length > 0) {
      localStorage.setItem(orderKey, JSON.stringify(order));
    }
  }, [order, orderKey]);

  const itemsById = useMemo(() => {
    const map = new Map<string, TileItem>();
    items.forEach((it) => map.set(it.id, it));
    return map;
  }, [items]);

  const orderedItems = useMemo(() => {
    const ids = order.length ? order : items.map((i) => i.id);
    // Ensure no missing/new ids
    const merged = [
      ...ids.filter((id) => itemsById.has(id)),
      ...items.map((i) => i.id).filter((id) => !ids.includes(id)),
    ];
    return merged.map((id) => itemsById.get(id)!).filter(Boolean) as TileItem[];
  }, [order, items, itemsById]);

  const onDragStart = (id: string, e: React.DragEvent) => {
    if (dragReadyId !== id) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', id);
    setDraggingId(id);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (targetId: string, e: React.DragEvent) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === targetId) return;
    setOrder((prev) => {
      const base = prev.length ? [...prev] : items.map((i) => i.id);
      const from = base.indexOf(sourceId);
      const to = base.indexOf(targetId);
      if (from === -1 || to === -1) return base;
      base.splice(to, 0, base.splice(from, 1)[0]);
      return base;
    });
    setDraggingId(null);
  };

  // Touch/mouse long-press to enable drag (2 seconds)
  const startLongPress = (id: string) => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => setDragReadyId(id), 600);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
    setDragReadyId(null);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!draggingId && dragReadyId) {
      setDraggingId(dragReadyId);
    }
    if (!draggingId) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const targetId = el?.closest('[data-tile-id]')?.getAttribute('data-tile-id');
    if (!targetId || targetId === draggingId) return;
    setOrder((prev) => {
      const base = prev.length ? [...prev] : items.map((i) => i.id);
      const from = base.indexOf(draggingId);
      const to = base.indexOf(targetId);
      if (from === -1 || to === -1) return base;
      base.splice(to, 0, base.splice(from, 1)[0]);
      return base;
    });
  };
  const onTouchEnd = () => {
    setDraggingId(null);
    cancelLongPress();
  };

  // Lock scroll while reordering
  useEffect(() => {
    if (dragReadyId || draggingId) {
      prevOverflowRef.current = document.body.style.overflow;
      prevTouchActionRef.current = (document.body.style as any).touchAction || '';
      document.body.style.overflow = 'hidden';
      (document.body.style as any).touchAction = 'none';
    } else {
      document.body.style.overflow = prevOverflowRef.current || '';
      (document.body.style as any).touchAction = prevTouchActionRef.current || '';
    }
    return () => {
      document.body.style.overflow = prevOverflowRef.current || '';
      (document.body.style as any).touchAction = prevTouchActionRef.current || '';
    };
  }, [dragReadyId, draggingId]);

  const getLabelLines = (title: string): [string, string] => {
    const parts = title.trim().split(/\s+/);
    if (parts.length >= 2) return [parts[0], parts[1]];
    return [parts[0] || '', ''];
  };

  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5 ${dragReadyId || draggingId ? 'touch-none select-none' : ''}`}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {orderedItems.map((item) => (
        <div
          key={item.id}
          data-tile-id={item.id}
          draggable
          onDragStart={(e) => onDragStart(item.id, e)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(item.id, e)}
          onTouchStart={() => startLongPress(item.id)}
          onTouchCancel={cancelLongPress}
          onMouseDown={() => startLongPress(item.id)}
          onMouseUp={cancelLongPress}
          onMouseLeave={cancelLongPress}
          className={`transition-all duration-300 ease-in-out ${
            draggingId === item.id 
              ? 'scale-95 opacity-80 transform rotate-2 shadow-lg z-10' 
              : dragReadyId === item.id 
                ? 'scale-105 shadow-md animate-pulse' 
                : 'hover:scale-102'
          }`}
        >
          <Card 
            className="cursor-pointer hover:bg-accent text-foreground [&_svg]:text-foreground" 
            onClick={dragReadyId !== item.id ? item.onClick : undefined}
          >
            <CardContent className="flex flex-col items-center justify-center p-4 md:p-5 lg:p-6 select-none h-28 md:h-32 lg:h-36 min-h-28 md:min-h-32 lg:min-h-36">
              {item.icon}
              <div className="mt-2 text-center leading-tight select-none">
                <div className="text-xs md:text-sm font-semibold whitespace-nowrap">{item.title}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};

export default ReorderableTiles;
