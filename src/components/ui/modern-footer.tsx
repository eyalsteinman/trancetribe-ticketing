import React from 'react';
import { Heart, Sparkles, Music } from 'lucide-react';

const ModernFooter = () => {
  return (
    <footer className="footer-modern animate-slide-in-up">
      <div className="content-wrapper">
        {/* Animated Elements */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-4 left-8 animate-float">
            <Music className="h-4 w-4 text-primary" />
          </div>
          <div className="absolute top-6 right-12 animate-float" style={{ animationDelay: '1s' }}>
            <Sparkles className="h-3 w-3 text-accent" />
          </div>
          <div className="absolute bottom-8 left-1/3 animate-float" style={{ animationDelay: '2s' }}>
            <Heart className="h-3 w-3 text-primary" />
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
              <span className="text-primary font-bold">T</span>
            </div>
            <h3 className="text-xl font-bold text-foreground">Trance Tribes</h3>
          </div>
          
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Creating unforgettable experiences through innovative ticketing solutions
          </p>
          
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-3 w-3 text-red-500 animate-pulse" />
            <span>by Eyal Steinman</span>
          </div>
          
          <p className="text-xs text-muted-foreground/60">
            © 2025 Trance Tribes Tickets. All rights reserved.
          </p>

          {/* Animated Background Line */}
          <div className="relative mt-8">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent">
              <div className="h-full w-8 bg-gradient-to-r from-primary/60 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default ModernFooter;