import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Circle, Target, Bomb, PenTool } from 'lucide-react';
import { useBackground } from '@/contexts/BackgroundContext';

interface UserGamesProps {
  onBack: () => void;
  onGameSelect: (game: string) => void;
}

const UserGames = ({ onBack, onGameSelect }: UserGamesProps) => {
  const { backgroundColor, isBackgroundDark } = useBackground();
  return (
  <div
      className="min-h-screen p-4 transition-colors duration-500"
      style={{ backgroundColor }}
    >
      <div className="max-w-md mx-auto space-y-6 text-left">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={onBack} aria-label="Back" className="absolute top-4 right-4 z-[9999] on-color back-button">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 
            className="text-xl font-bold"
            style={{ color: isBackgroundDark ? '#ffffff' : '#000000' }}
          >
            Games
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors text-black [&_svg]:text-black aspect-square" onClick={() => onGameSelect('color-changer')}>
            <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center">
              <Circle className="h-8 w-8 mb-2 text-black" />
              <div className="text-sm font-semibold text-black">Color Changer</div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors text-black [&_svg]:text-black aspect-square" onClick={() => onGameSelect('dot-circle')}>
            <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center">
              <Target className="h-8 w-8 mb-2 text-black" />
              <div className="text-sm font-semibold text-black">Dot Circle</div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors text-black [&_svg]:text-black aspect-square" onClick={() => onGameSelect('exploder')}>
            <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center">
              <Bomb className="h-8 w-8 mb-2 text-black" />
              <div className="text-sm font-semibold text-black">Exploder</div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors text-black [&_svg]:text-black aspect-square" onClick={() => onGameSelect('haya-ninja')}>
            <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center">
              <PenTool className="h-8 w-8 mb-2 text-black" />
              <div className="text-sm font-semibold text-black">
                Haya
                <br />
                Ninja
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserGames;
