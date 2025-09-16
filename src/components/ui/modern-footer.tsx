import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const ModernFooter = () => {
  const { t } = useLanguage();

  return (
    <footer className="relative mt-16 p-8 glass border-t border-white/10 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-16 h-16 bg-primary/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-12 h-12 bg-accent/30 rounded-full blur-xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative z-10 text-center space-y-4">
        <div className="float">
          <h3 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            {t('trance_tribes')}
          </h3>
          <div className="w-16 h-1 bg-gradient-to-r from-primary to-accent mx-auto mt-2 rounded-full"></div>
        </div>
        
        <p className="text-sm text-muted-foreground animate-fade-in">
          {t('created_by_eyal')} • {new Date().getFullYear()}
        </p>
        
        {/* Floating particles */}
        <div className="absolute top-2 left-8 w-2 h-2 bg-primary/50 rounded-full animate-bounce"></div>
        <div className="absolute top-4 right-12 w-1.5 h-1.5 bg-accent/50 rounded-full animate-bounce delay-300"></div>
        <div className="absolute bottom-6 left-16 w-1 h-1 bg-electric-blue/50 rounded-full animate-bounce delay-700"></div>
      </div>
    </footer>
  );
};

export default ModernFooter;