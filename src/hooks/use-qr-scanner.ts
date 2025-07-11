import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

interface UseQRScannerOptions {
  onScanSuccess?: (data: any) => void;
  debounceMs?: number;
}

export function useQRScanner({
  onScanSuccess,
  debounceMs = 1000,
}: UseQRScannerOptions = {}) {
  const [lastScannedId, setLastScannedId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const toastTimeoutRef = useRef<NodeJS.Timeout>();

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Debounced toast function to prevent spam
  const showToast = useCallback(
    (
      title: string,
      description: string,
      variant?: "default" | "destructive"
    ) => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }

      toastTimeoutRef.current = setTimeout(() => {
        toast({
          title,
          description,
          variant,
        });
      }, 100);
    },
    []
  );

  // Debounced scan processing to prevent duplicate scans
  const processScan = useCallback(
    (scannedText: string, processor: (text: string) => Promise<any>) => {
      // Clear any existing debounce timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Prevent processing the same QR code multiple times
      if (scannedText === lastScannedId && isProcessing) {
        console.log("Same QR code scanned while processing, ignoring...");
        return;
      }

      setIsProcessing(true);
      setLastScannedId(scannedText);

      debounceRef.current = setTimeout(async () => {
        try {
          const result = await processor(scannedText);
          if (result && onScanSuccess) {
            onScanSuccess(result);
          }
        } catch (error) {
          console.error("Error processing scan:", error);
          showToast("Scan Error", "Failed to process QR code", "destructive");
        } finally {
          setIsProcessing(false);
        }
      }, debounceMs);
    },
    [lastScannedId, isProcessing, onScanSuccess, debounceMs, showToast]
  );

  const resetScanner = useCallback(() => {
    setLastScannedId("");
    setIsProcessing(false);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  return {
    lastScannedId,
    isProcessing,
    showToast,
    processScan,
    resetScanner,
  };
}
