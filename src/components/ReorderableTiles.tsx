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
  const longPressTimer = useRef<number | null>(null);

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

  // Touch long-press to drag
  const startLongPress = (id: string) => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => setDraggingId(id), 250);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!draggingId) return;
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

  return (
    <div
      className="grid grid-cols-2 gap-4"
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
          className={`transition-transform ${draggingId === item.id ? 'scale-[0.98] opacity-90' : ''}`}
        >
          <Card className="cursor-pointer hover:bg-accent" onClick={item.onClick}>
            <CardContent className="flex flex-col items-center justify-center p-6 select-none">
              {item.icon}
              <span className="text-sm font-medium mt-2 text-center">{item.title}</span>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};

export default ReorderableTiles;
