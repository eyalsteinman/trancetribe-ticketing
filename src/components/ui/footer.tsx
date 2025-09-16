import React from 'react';

const Footer = () => {
  return (
    <footer className="footer-spacing">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-primary">Trance Tribes Tickets</h3>
          <p className="text-sm text-secondary mt-2">
            Created by Eyal Steinman, all rights reserved 2025
          </p>
        </div>
        
        <div className="flex justify-center">
          <div className="w-16 h-px bg-border"></div>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-tertiary">
            Modern • Minimal • Powerful
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;