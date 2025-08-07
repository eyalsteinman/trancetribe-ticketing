import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BoredScreenProps {
  onBack: () => void;
}

const BoredScreen = ({ onBack }: BoredScreenProps) => {
  const [backgroundColor, setBackgroundColor] = useState('#3b82f6'); // Start with blue

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const changeBackgroundColor = () => {
    setBackgroundColor(getRandomColor());
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center relative transition-colors duration-500"
      style={{ backgroundColor }}
    >
      {/* Back button in top left */}
      <Button 
        variant="outline"
        onClick={onBack}
        className="absolute top-4 left-4 flex items-center gap-2 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Small silver button in the middle */}
      <Button
        onClick={changeBackgroundColor}
        className="bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-800 font-medium px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)'
        }}
      >
        Change Color
      </Button>
    </div>
  );
};

export default BoredScreen;