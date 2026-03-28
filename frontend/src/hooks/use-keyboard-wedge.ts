import { useEffect, useRef } from 'react';

const RAPID_THRESHOLD_MS = 50;
const MIN_LENGTH = 4;

export function useKeyboardWedge(onBarcode: (barcode: string) => void) {
  const bufferRef = useRef('');
  const lastTimestampRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const now = Date.now();
      const elapsed = now - lastTimestampRef.current;

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= MIN_LENGTH) {
          onBarcode(bufferRef.current);
        }
        bufferRef.current = '';
        lastTimestampRef.current = 0;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        return;
      }

      if (e.key.length === 1) {
        if (elapsed > RAPID_THRESHOLD_MS && bufferRef.current.length > 0) {
          bufferRef.current = '';
        }
        bufferRef.current += e.key;
        lastTimestampRef.current = now;

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          bufferRef.current = '';
          lastTimestampRef.current = 0;
        }, 200);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onBarcode]);
}