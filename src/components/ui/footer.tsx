import React from 'react';

const Footer = () => {
  return (
    <div className="mt-8 pt-4 border-t border-border/30 text-center space-y-2">
      <div className="space-y-1">
        <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Trance Tribes Tickets
        </h3>
        <p className="text-xs text-muted-foreground">
          Created by Eyal Steinman • 2025
        </p>
      </div>
      <div className="text-xs text-muted-foreground/70">
        Connecting hearts through music
      </div>
    </div>
  );
};

export default Footer;