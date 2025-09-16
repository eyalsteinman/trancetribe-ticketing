import { Card, CardContent } from '@/components/ui/card';
import { Palette, Target, Gamepad2, PenTool } from 'lucide-react';
import { useBackground } from '@/contexts/BackgroundContext';
import PageHeader from '@/components/ui/page-header';
import Footer from '@/components/ui/footer';

interface AdminGamesProps {
  onBack: () => void;
  onGameSelect: (game: string) => void;
}

const AdminGames = ({ onBack, onGameSelect }: AdminGamesProps) => {
  const { backgroundColor, isBackgroundDark } = useBackground();
  
  return (
    <div 
      className="min-h-screen p-4 transition-colors duration-500"
      style={{ 
        backgroundColor
      }}
    >
      <PageHeader
        title="Games Administration"
        onBack={onBack}
      />
      
      <div className="w-full pt-20 space-y-6 text-left px-4">

        <div className="grid grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:bg-accent surface text-black [&_svg]:text-black" onClick={() => onGameSelect('color-changer')}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Palette className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium">Color Changer</span>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent surface text-black [&_svg]:text-black" onClick={() => onGameSelect('dot-circle')}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Target className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium">Dot Circle</span>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent surface text-black [&_svg]:text-black" onClick={() => onGameSelect('exploder')}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Gamepad2 className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium">Exploder</span>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent surface text-black [&_svg]:text-black" onClick={() => onGameSelect('haya-ninja')}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <PenTool className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium">Haya<br/>Ninja</span>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted surface text-black [&_svg]:text-black">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Gamepad2 className="h-8 w-8 mb-2 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Game 5 TBD</span>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted surface text-black [&_svg]:text-black">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Gamepad2 className="h-8 w-8 mb-2 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Game 6 TBD</span>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default AdminGames;