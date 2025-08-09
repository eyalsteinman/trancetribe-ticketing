import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { useBackground } from '@/contexts/BackgroundContext';
import { useToast } from '@/hooks/use-toast';

interface BoredScreenProps {
  onBack: () => void;
}

const BoredScreen = ({ onBack }: BoredScreenProps) => {
  const [backgroundColor, setBackgroundColor] = useState('#3b82f6'); // Start with blue
  const { setGlobalBackground } = useBackground();
  const { toast } = useToast();

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

  const saveAsBackground = () => {
    setGlobalBackground(backgroundColor);
    toast({
      title: "Background Saved",
      description: "The background has been applied to all pages!",
    });
    setTimeout(() => window.location.reload(), 1000);
  };

  const revertToWhite = () => {
    setBackgroundColor('#ffffff');
    setGlobalBackground('#ffffff');
    toast({
      title: "Background Reset",
      description: "Background has been reverted to white!",
    });
    setTimeout(() => window.location.reload(), 1000);
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

      {/* Game controls in center */}
      <div className="flex flex-col items-center gap-4">
        {/* Main change color button */}
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

        {/* Action buttons directly below */}
        <div className="flex gap-3">
          <Button
            onClick={saveAsBackground}
            size="sm"
            className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 transition-all duration-300 shadow-lg px-4 py-2 text-sm"
          >
            <Save className="h-4 w-4 mr-2" />
            Save as Background
          </Button>
          
          <Button
            onClick={revertToWhite}
            size="sm"
            className="bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 transition-all duration-300 shadow-lg px-4 py-2 text-sm"
          >
            Revert to White
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BoredScreen;