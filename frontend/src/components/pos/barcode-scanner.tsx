import { useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScanned: (barcode: string) => void;
}

export function BarcodeScanner({ open, onClose, onScanned }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { startScanning, stopScanning, isScanning, isLoading, error } = useBarcodeScanner((barcode) => {
    onScanned(barcode);
    onClose();
  });

  useEffect(() => {
    if (open && videoRef.current) {
      startScanning(videoRef.current);
    }
    return () => { stopScanning(); };
  }, [open, startScanning, stopScanning]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { stopScanning(); onClose(); } }}>
      <DialogContent showCloseButton={false} className="max-w-sm p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle>Scan Barcode</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => { stopScanning(); onClose(); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="relative aspect-square bg-black">
          <video
            ref={videoRef}
            id="barcode-scanner-viewport"
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
              <p className="text-sm text-white">Starting camera…</p>
            </div>
          )}
          {!isLoading && !isScanning && !error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
              <p className="text-sm text-white">Preparing scanner…</p>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-2 border-white/50 rounded-lg" />
          </div>
        </div>
        {error && (
          <p className="p-4 text-sm text-destructive">{error}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
