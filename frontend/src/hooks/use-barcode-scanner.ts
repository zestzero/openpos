import { useCallback, useRef, useState } from 'react';

interface UseBarcodeScanner {
  startScanning: (videoElement: HTMLVideoElement) => Promise<void>;
  stopScanning: () => void;
  isScanning: boolean;
  error: string | null;
}

export function useBarcodeScanner(onDetected: (barcode: string) => void): UseBarcodeScanner {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const stopScanning = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const startScanning = useCallback(async (videoElement: HTMLVideoElement) => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      videoElement.srcObject = stream;
      await videoElement.play();
      setIsScanning(true);

      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'],
        });

        const scan = async () => {
          if (!streamRef.current) return;
          try {
            const barcodes = await detector.detect(videoElement);
            if (barcodes.length > 0) {
              onDetected(barcodes[0].rawValue);
              stopScanning();
              return;
            }
          } catch {}
          animFrameRef.current = requestAnimationFrame(scan);
        };
        scan();
      } else {
        const { Html5Qrcode } = await import('html5-qrcode');
        const qr = new Html5Qrcode('barcode-scanner-viewport');
        await qr.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            onDetected(decodedText);
            qr.stop().catch(() => {});
            stopScanning();
          },
          () => {}
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Camera access denied');
      setIsScanning(false);
    }
  }, [onDetected, stopScanning]);

  return { startScanning, stopScanning, isScanning, error };
}