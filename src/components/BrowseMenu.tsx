import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from '@/contexts/LanguageContext';

interface BrowseMenuProps {
  value: string;
  onValueChange: (value: string) => void;
}

const BrowseMenu = ({ value, onValueChange }: BrowseMenuProps) => {
  const { t } = useLanguage();
  
  // Fallback text if translations are not available
  const getText = (key: string) => {
    try {
      return t(key);
    } catch {
      // Fallback to English text
      const fallbacks = {
        browse_by_production: 'Browse by Production',
        browse_by_party: 'Browse by Party', 
        browse_by_date: 'Browse by Date'
      };
      return fallbacks[key] || key;
    }
  };
  
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full mb-4">
        <SelectValue placeholder={getText('browse_by_production')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="production">{getText('browse_by_production')}</SelectItem>
        <SelectItem value="party">{getText('browse_by_party')}</SelectItem>
        <SelectItem value="date">{getText('browse_by_date')}</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default BrowseMenu;