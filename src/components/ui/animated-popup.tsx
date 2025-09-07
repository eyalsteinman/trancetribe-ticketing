import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

interface AnimatedPopupProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onClose?: () => void;
  show: boolean;
}

const AnimatedPopup = ({ type, message, duration = 3000, onClose, show }: AnimatedPopupProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      if (duration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300);
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [show, duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-6 h-6" />,
    error: <XCircle className="w-6 h-6" />,
    warning: <AlertCircle className="w-6 h-6" />,
    info: <Info className="w-6 h-6" />
  };

  const colors = {
    success: 'bg-green-500 border-green-400',
    error: 'bg-red-500 border-red-400',
    warning: 'bg-orange-500 border-orange-400',
    info: 'bg-blue-500 border-blue-400'
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
      <div
        className={`
          transform transition-all duration-500 ease-out
          ${isVisible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
          ${colors[type]}
          text-white px-6 py-4 rounded-2xl shadow-2xl
          flex items-center space-x-3 max-w-sm mx-4
          backdrop-blur-lg border border-opacity-50
          animate-pulse
        `}
      >
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <p className="font-semibold text-sm">{message}</p>
      </div>
    </div>
  );
};

export default AnimatedPopup;