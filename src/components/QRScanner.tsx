import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, X, Smartphone } from 'lucide-react';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

const QRScanner = ({ onScan, onClose }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let qrScanner: QrScanner | null = null;

    const initScanner = async () => {
      if (!videoRef.current) return;

      try {
        // Check if camera is available
        const hasCamera = await QrScanner.hasCamera();
        setHasCamera(hasCamera);

        if (!hasCamera) {
          setError('No camera found on this device');
          return;
        }

        // Small delay to ensure video element is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        qrScanner = new QrScanner(
          videoRef.current,
          (result) => {
            onScan(result.data);
            qrScanner?.stop();
            setIsScanning(false);
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );

        setScanner(qrScanner);
        await qrScanner.start();
        setIsScanning(true);
        setError(null);
      } catch (err) {
        console.error('Scanner initialization error:', err);
        setError('Failed to access camera. Please check permissions.');
        setHasCamera(false);
      }
    };

    // Delay initialization to ensure component is fully mounted
    const timer = setTimeout(initScanner, 200);

    return () => {
      clearTimeout(timer);
      if (qrScanner) {
        qrScanner.stop();
        qrScanner.destroy();
      }
    };
  }, [onScan]);

  const handleStop = () => {
    if (scanner) {
      scanner.stop();
      setIsScanning(false);
    }
    onClose();
  };

  const handleRestart = async () => {
    if (scanner && hasCamera) {
      try {
        await scanner.start();
        setIsScanning(true);
        setError(null);
      } catch (err) {
        setError('Failed to restart camera');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            QR Code Scanner
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={handleStop}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="text-center space-y-4">
              <div className="flex flex-col items-center text-muted-foreground">
                <Smartphone className="h-12 w-12 mb-2" />
                <p className="text-sm">{error}</p>
              </div>
              {hasCamera && (
                <Button onClick={handleRestart} variant="outline" className="w-full">
                  Try Again
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full rounded-lg bg-black"
                  style={{ aspectRatio: '1' }}
                />
                {!isScanning && hasCamera && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                    <div className="text-white text-center">
                      <Camera className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Starting camera...</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Position the QR code within the camera view
                </p>
                {isScanning && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Camera active - scanning for QR codes
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleStop}
                  className="flex-1"
                >
                  Cancel
                </Button>
                {!isScanning && hasCamera && (
                  <Button 
                    onClick={handleRestart}
                    className="flex-1"
                  >
                    Start Scanning
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QRScanner;