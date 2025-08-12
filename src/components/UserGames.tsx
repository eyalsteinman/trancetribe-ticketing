import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack} aria-label="Back" className="on-color back-button">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Games</h1>
        </div>

        <div className="grid gap-4">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => onGameSelect('color-changer')}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2">
                <Circle className="h-12 w-12" />
              </div>
              <CardTitle>Color Changer</CardTitle>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => onGameSelect('dot-circle')}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2">
                <Target className="h-12 w-12" />
              </div>
              <CardTitle>Dot Circle</CardTitle>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => onGameSelect('exploder')}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2">
                <Bomb className="h-12 w-12" />
              </div>
              <CardTitle>Exploder</CardTitle>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => onGameSelect('haya-ninja')}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2">
                <PenTool className="h-12 w-12" />
              </div>
              <CardTitle>
                Haya
                <br />
                Ninja
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserGames;
