import { Card, CardContent } from '@/components/ui/card';
import { Circle, Target, Bomb, PenTool } from 'lucide-react';
import { useBackground } from '@/contexts/BackgroundContext';
import PageHeader from '@/components/ui/page-header';
import Footer from '@/components/ui/footer';

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
      <PageHeader
        title="Games"
        onBack={onBack}
      />
      
      <div className="max-w-md mx-auto pt-20 space-y-6 text-left">

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

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default UserGames;
