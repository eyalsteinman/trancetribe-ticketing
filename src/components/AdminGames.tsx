import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Palette, Target, Gamepad2 } from 'lucide-react';

interface AdminGamesProps {
  onBack: () => void;
  onGameSelect: (game: string) => void;
}

const AdminGames = ({ onBack, onGameSelect }: AdminGamesProps) => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Games</h1>
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:bg-accent" onClick={() => onGameSelect('color-changer')}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Palette className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium">Color Changer</span>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent" onClick={() => onGameSelect('dot-circle')}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Target className="h-8 w-8 mb-2" />
              <span className="text-sm font-medium">Dot Circle</span>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Gamepad2 className="h-8 w-8 mb-2 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Game 3 TBD</span>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Gamepad2 className="h-8 w-8 mb-2 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Game 4 TBD</span>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Gamepad2 className="h-8 w-8 mb-2 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Game 5 TBD</span>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted">
            <CardContent className="flex flex-col items-center justify-center p-6">
              <Gamepad2 className="h-8 w-8 mb-2 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Game 6 TBD</span>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminGames;