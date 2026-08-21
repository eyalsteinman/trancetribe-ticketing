import { useCallback, useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CameraOff, Loader2, ScanLine, X } from 'lucide-react';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

type ScannerStatus = 'starting' | 'scanning' | 'paused' | 'error';

const QRScanner = ({ onScan, onClose }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [status, setStatus] = useState<ScannerStatus>('starting');
  const [hasCamera, setHasCamera] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stopScanner = useCallback(() => {
    scannerRef.current?.stop();
    scannerRef.current?.destroy();
    scannerRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setStatus('starting');
    setError(null);

    try {
      const cameraAvailable = await QrScanner.hasCamera();
      setHasCamera(cameraAvailable);

      if (!cameraAvailable) {
        setError('We could not find a camera on this device.');
        setStatus('error');
        return;
      }

      if (!videoRef.current) return;

      if (!scannerRef.current) {
        scannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            scannerRef.current?.stop();
            setStatus('paused');
            onScan(result.data);
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );
      }

      await scannerRef.current.start();
      setStatus('scanning');
    } catch (err) {
      console.error('Scanner initialization error:', err);
      setError('Camera access was blocked. Allow camera permission in your browser and try again.');
      setStatus('error');
    }
  }, [onScan]);

  useEffect(() => {
    const timer = setTimeout(start, 250);
    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [start, stopScanner]);

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="QR code scanner"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" aria-hidden="true" />
            QR Scanner
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            aria-label="Close QR scanner"
            className="min-h-11 min-w-11"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'error' ? (
            <div className="space-y-4 text-center" role="alert">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                <CameraOff className="h-7 w-7" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-foreground">Camera not available</p>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="min-h-11 flex-1" onClick={handleClose}>
                  Cancel
                </Button>
                {hasCamera && (
                  <Button className="min-h-11 flex-1" onClick={start}>
                    Try again
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-2">
                <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
                {status === 'starting' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/60 text-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
                    <p className="text-sm">Starting camera…</p>
                  </div>
                )}
              </div>

              <div aria-live="polite" className="space-y-2 text-center">
                <p className="text-sm text-muted-foreground">
                  Position the QR code inside the frame.
                </p>
                {status === 'scanning' && (
                  <p className="flex items-center justify-center gap-2 text-sm text-primary">
                    <ScanLine className="h-4 w-4 animate-pulse" aria-hidden="true" />
                    Scanning…
                  </p>
                )}
                {status === 'paused' && (
                  <p className="text-sm text-muted-foreground">Processing scan…</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="min-h-11 flex-1" onClick={handleClose}>
                  Cancel
                </Button>
                {status === 'paused' && (
                  <Button className="min-h-11 flex-1" onClick={start}>
                    Scan another
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
