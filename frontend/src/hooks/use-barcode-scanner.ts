import { useCallback, useRef, useState } from 'react';

interface UseBarcodeScanner {
  startScanning: (videoElement: HTMLVideoElement) => Promise<void>;
  stopScanning: () => void;
  isScanning: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useBarcodeScanner(onDetected: (barcode: string) => void): UseBarcodeScanner {
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const html5QrcodeRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const startAttemptRef = useRef(0);

  const log = (...args: unknown[]) => {
    console.info('[barcode-scanner]', ...args);
  };

  const mapCameraError = (err: unknown) => {
    if (err instanceof DOMException) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        return 'Camera permission denied. Please allow camera access in your browser settings.';
      }
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        return 'No camera found on this device.';
      }
      if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        return 'Camera is already in use by another app. Please close other camera apps and try again.';
      }
      if (err.name === 'OverconstrainedError') {
        return 'Unable to access the back camera. Please try again or switch camera settings.';
      }
      if (err.name === 'SecurityError') {
        return 'Camera access is blocked by browser security settings.';
      }
      if (err.name === 'NotSupportedError') {
        return 'Camera is not supported in this browser context. Use HTTPS or localhost.';
      }
    }

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      return 'Camera requires a secure context (HTTPS) or localhost.';
    }

    return err instanceof Error ? err.message : 'Failed to initialize camera scanner.';
  };

  const checkCameraPermission = async () => {
    if (!('permissions' in navigator) || !navigator.permissions?.query) {
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      log('permission state', permission.state);
      if (permission.state === 'denied') {
        throw new Error('Camera permission denied. Please enable camera access in your browser settings.');
      }
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes('permission denied')) {
        throw err;
      }
    }
  };

  const stopScanning = useCallback(() => {
    startAttemptRef.current += 1;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (html5QrcodeRef.current) {
      html5QrcodeRef.current.stop().catch(() => {});
      html5QrcodeRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    const viewport = document.getElementById('barcode-scanner-viewport');
    if (viewport instanceof HTMLVideoElement) {
      viewport.srcObject = null;
    }

    log('scanner stopped');
    setIsScanning(false);
    setIsLoading(false);
  }, []);

  const startScanning = useCallback(async (videoElement: HTMLVideoElement) => {
    const runId = ++startAttemptRef.current;
    const isStale = () => runId !== startAttemptRef.current;

    try {
      log('start requested');
      setError(null);
      setIsLoading(true);

      if (typeof window !== 'undefined' && !window.isSecureContext) {
        throw new Error('Camera requires HTTPS (or localhost). Please open this app in a secure context.');
      }

      const supportsBarcodeDetector = 'BarcodeDetector' in window;
      log('supports BarcodeDetector', supportsBarcodeDetector);

      if (supportsBarcodeDetector) {
        await checkCameraPermission();

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera API is not available in this browser.');
        }

        log('requesting getUserMedia stream');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        });

        if (isStale()) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        videoElement.srcObject = stream;
        await videoElement.play();

        if (isStale()) {
          stream.getTracks().forEach(t => t.stop());
          videoElement.srcObject = null;
          return;
        }

        setIsScanning(true);
        setIsLoading(false);
        log('video stream attached and playing');

        const detector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'],
        });

        const scan = async () => {
          if (!streamRef.current || isStale()) return;
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
        log('using html5-qrcode fallback');
        const { Html5Qrcode } = await import('html5-qrcode');

        if (isStale()) return;

        const qr = new Html5Qrcode('barcode-scanner-viewport');
        html5QrcodeRef.current = qr;
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

        if (isStale()) {
          qr.stop().catch(() => {});
          html5QrcodeRef.current = null;
          return;
        }

        setIsScanning(true);
        setIsLoading(false);
        log('html5-qrcode started');
      }
    } catch (err) {
      log('start failed', err);
      setError(mapCameraError(err));
      setIsScanning(false);
      setIsLoading(false);
    }
  }, [onDetected, stopScanning]);

  return { startScanning, stopScanning, isScanning, isLoading, error };
}
