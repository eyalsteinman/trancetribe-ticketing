import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BrowseMenuProps {
  value: string;
  onValueChange: (value: string) => void;
}

const BrowseMenu = ({ value, onValueChange }: BrowseMenuProps) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full mb-4">
        <SelectValue placeholder="Browse by production" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="production">Browse by production</SelectItem>
        <SelectItem value="party">Browse by party</SelectItem>
        <SelectItem value="date">Browse by date</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default BrowseMenu;