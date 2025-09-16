import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from '@/contexts/LanguageContext';

interface BrowseMenuProps {
  value: string;
  onValueChange: (value: string) => void;
}

const BrowseMenu = ({ value, onValueChange }: BrowseMenuProps) => {
  const { t } = useLanguage();
  
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full mb-4">
        <SelectValue placeholder={t('browse_by_production')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="production">{t('browse_by_production')}</SelectItem>
        <SelectItem value="party">{t('browse_by_party')}</SelectItem>
        <SelectItem value="date">{t('browse_by_date')}</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default BrowseMenu;