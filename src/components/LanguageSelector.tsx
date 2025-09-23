import React from 'react';
import { useLanguage, Language } from '@/contexts/LanguageContext';

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'en' },
    { code: 'he', label: 'he' },
    { code: 'sp', label: 'sp' },
    { code: 'fr', label: 'fr' },
    { code: 'it', label: 'it' },
  ];

  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      {languages.map((lang, index) => (
        <React.Fragment key={lang.code}>
          <button
            onClick={() => setLanguage(lang.code)}
            className={`text-sm font-medium transition-colors px-3 py-2 rounded-full ${
              language === lang.code
                ? 'text-purple-600 font-bold bg-white'
                : 'text-white hover:text-white hover:bg-white/10'
            }`}
          >
            {lang.label}
          </button>
          {index < languages.length - 1 && (
            <span className="text-white/60">/</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default LanguageSelector;