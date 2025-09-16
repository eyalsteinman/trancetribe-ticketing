import React, { useState, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Tile {
  id: string;
  title: string;
  action: () => void;
}

interface SortableItemProps {
  tile: Tile;
  onTileClick: (tile: Tile) => void;
  onCloseMenu: () => void;
}

function SortableItem({ tile, onTileClick, onCloseMenu }: SortableItemProps) {
  const [isLongPress, setIsLongPress] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout>();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tile.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
    }, 2000);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    if (!isLongPress) {
      onTileClick(tile);
      onCloseMenu();
    }
    
    setIsLongPress(false);
  };

  const handlePointerLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setIsLongPress(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full text-left p-2 text-white hover:bg-white/10 rounded-lg transition-all text-sm cursor-pointer ${
        isLongPress ? 'bg-white/20 scale-105' : ''
      }`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      {...attributes}
      {...listeners}
    >
      {tile.title}
    </div>
  );
}

interface ReorderableMenuItemsProps {
  tiles: Tile[];
  onTileClick: (tile: Tile) => void;
  onCloseMenu: () => void;
  onReorder: (tiles: Tile[]) => void;
}

const ReorderableMenuItems: React.FC<ReorderableMenuItemsProps> = ({
  tiles,
  onTileClick,
  onCloseMenu,
  onReorder,
}) => {
  const [items, setItems] = useState(tiles);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 2000,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over?.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      onReorder(newItems);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {items.map((tile) => (
            <SortableItem
              key={tile.id}
              tile={tile}
              onTileClick={onTileClick}
              onCloseMenu={onCloseMenu}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default ReorderableMenuItems;