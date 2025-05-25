"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Camera, 
  StopCircle, 
  RefreshCw, 
  CheckCircle, 
  Scan, 
  Upload, 
  Image, 
  MoreVertical,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Status } from "@prisma/client";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface QRScannerProps {
  onScanSuccess?: (data: ProductionOrderDetails) => void;
}

interface ProductionOrderDetails {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
    description?: string;
  };
  quantity: number;
  completedQuantity: number;
  status: string;
  priority: string;
  startDate: string;
  dueDate: string;
  notes?: string;
  operations: Array<{
    id: string;
    status: string;
    startTime: string;
    endTime: string;
    workCenter: {
      id: string;
      name: string;
    };
    notes?: string;
  }>;
  canUpdate: boolean;
}

export function QRScanner({ onScanSuccess }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ProductionOrderDetails | null>(null);
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraId, setCameraId] = useState<string>("");
  const [cameras, setCameras] = useState<{id: string, label: string}[]>([]);
  const [permissionError, setPermissionError] = useState<string>("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Get available cameras on component mount
  useEffect(() => {
    const getCameras = async () => {
      try {
        console.log("Starting camera detection...");
        
        // Check if we're on HTTPS or localhost (required for camera access)
        const isSecure = window.location.protocol === 'https:' || 
                        window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
        
        if (!isSecure) {
          setPermissionError("Camera access requires HTTPS or localhost. Current protocol: " + window.location.protocol);
          return;
        }

        // Check if media devices API is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setPermissionError("Media Devices API not supported in this browser. Try Chrome, Firefox, or Safari.");
          return;
        }

        // Request camera permission first with multiple fallbacks
        let stream: MediaStream | null = null;
        try {
          console.log("Requesting camera permission...");
          // Try environment (back) camera first
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } 
          });
          console.log("Environment camera access granted");
        } catch (envError) {
          console.log("Environment camera failed, trying user camera:", envError);
          try {
            // Fallback to user (front) camera
            stream = await navigator.mediaDevices.getUserMedia({ 
              video: { 
                facingMode: "user",
                width: { ideal: 1280 },
                height: { ideal: 720 }
              } 
            });
            console.log("User camera access granted");
          } catch (userError) {
            console.log("User camera failed, trying any camera:", userError);
            try {
              // Final fallback - any camera
              stream = await navigator.mediaDevices.getUserMedia({ 
                video: true 
              });
              console.log("Any camera access granted");
            } catch (anyError) {
              console.error("All camera access attempts failed:", anyError);
              throw anyError;
            }
          }
        }

        // Stop the stream immediately, we just wanted permission
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          console.log("Permission stream stopped");
        }

        // Now get available cameras using Html5Qrcode
        console.log("Getting camera list...");
        const devices = await Html5Qrcode.getCameras();
        console.log("Available cameras:", devices);
        
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera if available
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment') ||
            device.label.toLowerCase().includes('facing back')
          );
          const selectedCamera = backCamera || devices[0];
          setCameraId(selectedCamera.id);
          setPermissionError("");
          console.log("Selected camera:", selectedCamera);
        } else {
          // Fallback: try manual device enumeration
          console.log("Html5Qrcode.getCameras() returned no devices, trying manual enumeration...");
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
          console.log("Manual enumeration found:", videoDevices);
          
          if (videoDevices.length > 0) {
            const formattedDevices = videoDevices.map(device => ({
              id: device.deviceId,
              label: device.label || `Camera ${device.deviceId.slice(0, 8)}`
            }));
            setCameras(formattedDevices);
            setCameraId(formattedDevices[0].id);
            setPermissionError("");
            console.log("Using manually detected cameras:", formattedDevices);
          } else {
            setPermissionError("No cameras detected. Please ensure your device has a camera and permissions are granted.");
          }
        }
      } catch (err: any) {
        console.error("Camera detection error:", err);
        let errorMessage = "Camera access failed: ";
        
        if (err.name === 'NotAllowedError') {
          errorMessage += "Permission denied. Please allow camera access in browser settings.";
        } else if (err.name === 'NotFoundError') {
          errorMessage += "No camera found on this device.";
        } else if (err.name === 'NotReadableError') {
          errorMessage += "Camera is in use by another application.";
        } else if (err.name === 'OverconstrainedError') {
          errorMessage += "Camera constraints not supported.";
        } else if (err.name === 'SecurityError') {
          errorMessage += "Security error. Ensure you're using HTTPS or localhost.";
        } else {
          errorMessage += err.message || "Unknown error occurred.";
        }
        
        setPermissionError(errorMessage);
      }
    };
    
    getCameras();
  }, []);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [html5QrCode]);

  // Fetch production order details from API
  const fetchProductionOrderDetails = async (productionOrderId: string): Promise<ProductionOrderDetails | null> => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/worker/production-order/${productionOrderId}/details`);
      
      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.error || `HTTP ${response.status}`;
        
        // Provide user-friendly error messages for common issues
        if (response.status === 400 && errorMessage.includes("not assigned to any work centers")) {
          errorMessage = "You are not assigned to any work centers. Please contact your supervisor.";
        } else if (response.status === 403) {
          errorMessage = "You don't have access to this production order. It may be assigned to different work centers.";
        } else if (response.status === 404) {
          errorMessage = "Production order not found. Please check the QR code.";
        } else if (response.status === 401) {
          errorMessage = "Please log in again to access production orders.";
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching production order details:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch production order details",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Process scanned QR code
  const processScannedCode = async (scannedText: string) => {
    console.log("Scanned text:", scannedText);
    
    let productionOrderId: string;

    try {
      // Try to parse as JSON first (if QR contains JSON)
      const jsonData = JSON.parse(scannedText);
      productionOrderId = jsonData.id || jsonData.productionOrderId || jsonData.orderId;
    } catch {
      // If not JSON, treat the entire text as production order ID
      productionOrderId = scannedText.trim();
    }

    if (!productionOrderId) {
      toast({
        title: "Invalid QR Code",
        description: "Could not extract production order ID from QR code",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "QR Code Scanned",
      description: `Fetching details for production order: ${productionOrderId}`,
    });

    // Fetch production order details
    const details = await fetchProductionOrderDetails(productionOrderId);
    
    if (details) {
      setScannedData(details);
      if (onScanSuccess) onScanSuccess(details);
      
      toast({
        title: "Production Order Found",
        description: `${details.product.name} - ${details.operations.length} operation(s)`,
      });
    }
  };

  const startScanner = async () => {
    if (!cameraId) {
      toast({
        title: "No Camera Selected",
        description: "Please select a camera first",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setPermissionError("");
    
    try {
      console.log("Starting scanner with camera ID:", cameraId);
      
      // Wait a bit to ensure DOM element is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if the element exists before initializing
      const qrReaderElement = document.getElementById("qr-reader");
      if (!qrReaderElement) {
        throw new Error("QR reader element not found in DOM. Please try again.");
      }
      
      const scanner = new Html5Qrcode("qr-reader");
      setHtml5QrCode(scanner);
      
      const qrCodeSuccessCallback = async (decodedText: string) => {
        console.log("QR Code detected:", decodedText);
        stopScanner();
        await processScannedCode(decodedText);
      };
      
      const qrCodeErrorCallback = (errorMessage: string) => {
        // Suppress normal scanning errors - these are expected during scanning
        // Only log actual errors, not "No QR code found" or "NotFoundException"
        if (
          errorMessage.includes("No QR code found") ||
          errorMessage.includes("NotFoundException") ||
          errorMessage.includes("No MultiFormat Readers") ||
          errorMessage.includes("QR code parse error")
        ) {
          // These are normal when scanning - don't log them
          return;
        }
        
        // Only log unexpected errors
        console.log("QR scan error:", errorMessage);
      };
      
      // Try multiple camera configurations with square QR box
      const configurations = [
        // Configuration 1: Specific device with ideal settings (SQUARE QR BOX)
        {
          deviceId: cameraId,
          config: { 
            fps: 10, 
            qrbox: { width: 280, height: 280 }, // Square QR detection box
            aspectRatio: 1.0,
            disableFlip: false,
          }
        },
        // Configuration 2: Specific device with relaxed settings (SQUARE)
        {
          deviceId: cameraId,
          config: { 
            fps: 5, 
            qrbox: { width: 250, height: 250 }, // Square QR detection box
          }
        },
        // Configuration 3: Facingmode fallback (SQUARE)
        {
          facingMode: "environment",
          config: { 
            fps: 5, 
            qrbox: { width: 220, height: 220 }, // Square QR detection box
          }
        },
        // Configuration 4: Any camera (SQUARE)
        {
          facingMode: "user",
          config: { 
            fps: 5, 
            qrbox: { width: 200, height: 200 }, // Square QR detection box
          }
        }
      ];

      let lastError: any = null;
      
      for (let i = 0; i < configurations.length; i++) {
        const { deviceId, facingMode, config } = configurations[i];
        const cameraConfig = deviceId ? { deviceId } : { facingMode };
        
        try {
          console.log(`Trying camera configuration ${i + 1}:`, cameraConfig, config);
          
          await scanner.start(
            cameraConfig,
            config,
            qrCodeSuccessCallback,
            qrCodeErrorCallback
          );
          
          console.log("Scanner started successfully with configuration", i + 1);
          setPermissionError("");
          return; // Success! Exit the function
          
        } catch (configError: any) {
          console.log(`Configuration ${i + 1} failed:`, configError);
          lastError = configError;
          
          // If scanner was partially started, try to stop it
          try {
            if (scanner.isScanning) {
              await scanner.stop();
            }
          } catch (stopError) {
            console.log("Error stopping scanner:", stopError);
          }
          
          // Continue to next configuration
          continue;
        }
      }
      
      // If we get here, all configurations failed
      throw lastError || new Error("All camera configurations failed");
      
    } catch (error: any) {
      console.error("Scanner start error:", error);
      setIsScanning(false);
      setHtml5QrCode(null);
      
      let errorMessage = "Failed to start camera: ";
      
      if (error.message?.includes("not found")) {
        errorMessage += "Camera element not ready. Please try again in a moment.";
      } else if (error.name === 'NotAllowedError' || error.message?.includes("Permission denied")) {
        errorMessage += "Camera permission denied. Please allow camera access and refresh the page.";
      } else if (error.name === 'NotFoundError' || error.message?.includes("not found")) {
        errorMessage += "Camera not found. Please check your camera connection.";
      } else if (error.name === 'NotReadableError' || error.message?.includes("could not be started")) {
        errorMessage += "Camera is in use by another application. Please close other camera apps.";
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += "Camera settings not supported. Try a different camera.";
      } else if (error.message?.includes("HTTPS")) {
        errorMessage += "Camera requires HTTPS or localhost. Current: " + window.location.protocol;
      } else {
        errorMessage += error.message || "Unknown camera error.";
      }
      
      setPermissionError(errorMessage);
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopScanner = () => {
    if (html5QrCode && html5QrCode.isScanning) {
      html5QrCode.stop()
        .then(() => {
          setIsScanning(false);
          setHtml5QrCode(null);
        })
        .catch(console.error);
    } else {
      setIsScanning(false);
    }
  };

  const resetScanner = () => {
    setScannedData(null);
    setNewStatus("");
    setNotes("");
  };

  // Add camera reset function
  const resetCamera = async () => {
    // Stop current scanner if running
    if (html5QrCode && html5QrCode.isScanning) {
      try {
        await html5QrCode.stop();
      } catch (error) {
        console.log("Error stopping scanner during reset:", error);
      }
    }
    
    setHtml5QrCode(null);
    setIsScanning(false);
    setPermissionError("");
    setCameras([]);
    setCameraId("");
    
    // Re-initialize cameras
    setTimeout(() => {
      window.location.reload(); // Simple but effective way to reset everything
    }, 500);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingImage(true);

    try {
      const scanner = new Html5Qrcode("qr-file-reader");
      
      const result = await scanner.scanFile(file, false);
      await processScannedCode(result);
      
    } catch (error: any) {
      console.error("File scan error:", error);
      
      let errorMessage = "Could not detect a valid QR code in the uploaded image.";
      
      // Provide more specific error messages
      if (error.message?.includes("NotFoundException")) {
        errorMessage = "No QR code found in the image. Please ensure the QR code is clearly visible.";
      } else if (error.message?.includes("ChecksumException")) {
        errorMessage = "QR code appears damaged or unclear. Please try a better quality image.";
      } else if (error.message?.includes("FormatException")) {
        errorMessage = "Invalid QR code format. Please ensure it's a valid production order QR code.";
      }
      
      toast({
        title: "No QR Code Found",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUpdateStatus = async () => {
    if (!scannedData || !newStatus) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/worker/production-order/${scannedData.id}/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus as Status,
          notes: notes || `Status updated via QR scan to ${newStatus} at ${new Date().toLocaleString()}`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Update failed');
      }

      toast({
        title: "Status Updated",
        description: `Production order status updated to ${newStatus}`,
      });
      
      resetScanner();
      router.refresh();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update production order status.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Test function for development
  const simulateScan = async () => {
    // Use a real production order ID for testing
    // You should replace this with an actual ID from your database
    const testProductionOrderId = "PO-2024-001";
    
    toast({
      title: "Development Test",
      description: `Testing with production order: ${testProductionOrderId}`,
    });
    
    await processScannedCode(testProductionOrderId);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "IN_PROGRESS":
        return "outline";
      case "COMPLETED":
        return "default";
      case "CANCELLED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "destructive";
      case "HIGH":
        return "destructive";
      case "MEDIUM":
        return "outline";
      case "LOW":
        return "secondary";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <Card className="w-full">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-4 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Loading Production Order</p>
                <p className="text-sm text-muted-foreground">Fetching details from the system...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {!scannedData ? (
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-xl md:text-2xl">QR Code Scanner</CardTitle>
            <CardDescription className="text-base">
              Scan a production order QR code to update its status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="camera" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1 bg-muted rounded-lg">
                <TabsTrigger 
                  value="camera" 
                  className="flex items-center justify-center gap-2 py-2 px-4 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                >
                  <Camera className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Use Camera</span>
                  <span className="sm:hidden font-medium">Camera</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="upload" 
                  className="flex items-center justify-center gap-2 py-2 px-4 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Upload Image</span>
                  <span className="sm:hidden font-medium">Upload</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="camera" className="space-y-4">
                <div className="flex flex-col items-center">
                  {isScanning ? (
                    <div className="w-full max-w-lg relative">
                      <div 
                        id="qr-reader" 
                        className="w-full h-64 sm:h-80 md:h-96 bg-muted relative overflow-hidden rounded-lg border-2 border-primary/20"
                      ></div>
                      <div className="absolute inset-x-0 bottom-4 flex justify-center">
                        <Button
                          variant="destructive"
                          size="lg"
                          className="shadow-lg"
                          onClick={stopScanner}
                        >
                          <StopCircle className="mr-2 h-5 w-5" />
                          Stop Scanning
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-lg space-y-6">
                      {/* Camera Preview Area */}
                      <div className="flex flex-col items-center justify-center p-8 md:p-12 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/50 min-h-[16rem] md:min-h-[20rem]">
                        <Camera className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
                        <p className="text-center text-muted-foreground mb-6 text-sm md:text-base max-w-sm">
                          Position a production order QR code in the camera view
                        </p>
                        
                        {/* Error Display */}
                        {permissionError && (
                          <div className="w-full mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center mt-0.5">
                                <span className="text-destructive text-xs font-bold">!</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-destructive text-sm mb-2">Camera Access Issue</div>
                                <div className="text-destructive/90 text-sm whitespace-pre-line break-words">
                                  {permissionError}
                                </div>
                                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                                  <Button variant="outline" size="sm" onClick={resetCamera} className="flex-1 sm:flex-none">
                                    <RefreshCw className="mr-2 h-3 w-3" />
                                    Reset Camera
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => window.open('chrome://settings/content/camera', '_blank')}
                                    className="flex-1 sm:flex-none"
                                  >
                                    Camera Settings
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Camera Selection */}
                        {cameras.length > 1 && (
                          <div className="w-full mb-6">
                            <label htmlFor="camera" className="text-sm font-medium mb-2 block">
                              Select Camera:
                            </label>
                            <Select
                              value={cameraId}
                              onValueChange={setCameraId}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select camera" />
                              </SelectTrigger>
                              <SelectContent>
                                {cameras.map((camera) => (
                                  <SelectItem key={camera.id} value={camera.id}>
                                    {camera.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                          <Button 
                            onClick={startScanner} 
                            disabled={!cameraId}
                            size="lg"
                            className="flex-1"
                          >
                            <Camera className="mr-2 h-5 w-5" />
                            Start Camera
                          </Button>
                          
                          {process.env.NODE_ENV === 'development' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                                  <MoreVertical className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={simulateScan}>
                                  <Scan className="mr-2 h-4 w-4" />
                                  Test Scan
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      
                      {/* Helpful Tips */}
                      <div className="text-center text-sm text-muted-foreground space-y-2">
                        <p className="font-medium">💡 Tips for best results:</p>
                        <ul className="text-xs space-y-1 max-w-sm mx-auto">
                          <li>• Ensure good lighting on the QR code</li>
                          <li>• Hold camera steady and centered</li>
                          <li>• Try different distances if not detecting</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="upload" className="space-y-4">
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-lg">
                    <div className="flex flex-col items-center justify-center p-8 md:p-12 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/50 min-h-[16rem] md:min-h-[20rem]">
                      {isProcessingImage ? (
                        <div className="flex flex-col items-center justify-center">
                          <Loader2 className="h-12 w-12 md:h-16 md:w-16 animate-spin mb-4 text-primary" />
                          <p className="text-center text-muted-foreground text-sm md:text-base">
                            Processing image...
                          </p>
                        </div>
                      ) : (
                        <>
                          <Image className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
                          <p className="text-center text-muted-foreground mb-6 text-sm md:text-base max-w-sm">
                            Upload an image containing a production QR code
                          </p>
                          
                          <div className="hidden">
                            <div id="qr-file-reader"></div>
                          </div>
                          
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="qr-file-input"
                          />
                          
                          <Button 
                            onClick={() => fileInputRef.current?.click()}
                            size="lg"
                            className="w-full sm:w-auto"
                          >
                            <Upload className="mr-2 h-5 w-5" />
                            Choose Image
                          </Button>
                        </>
                      )}
                    </div>
                    
                    {/* Upload Instructions */}
                    <div className="mt-4 text-center text-sm text-muted-foreground space-y-2">
                      <p className="font-medium">📁 Supported formats:</p>
                      <p className="text-xs">JPG, PNG, GIF, WebP</p>
                      <p className="text-xs">Ensure the QR code is clearly visible</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Production Order Details</CardTitle>
            <CardDescription className="text-base">
              Update the status of this production order
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Production Order Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Order ID</p>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{scannedData.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Current Status</p>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    scannedData.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    scannedData.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    scannedData.status === 'PENDING' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {scannedData.status}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Priority</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  scannedData.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                  scannedData.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                  scannedData.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {scannedData.priority}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Product</p>
                <p className="text-sm font-semibold">{scannedData.product.name}</p>
                <p className="text-xs text-muted-foreground">SKU: {scannedData.product.sku}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                <p className="text-sm">
                  <span className="font-semibold">{scannedData.completedQuantity}</span>
                  <span className="text-muted-foreground"> / {scannedData.quantity} completed</span>
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                <p className="text-sm">{formatDateTime(scannedData.dueDate)}</p>
              </div>
            </div>

            {/* Operations */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Your Operations ({scannedData.operations.length})</h3>
              <div className="space-y-2">
                {scannedData.operations.map((operation) => (
                  <div key={operation.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/50 rounded-lg border">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{operation.workCenter.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(operation.startTime)} - {formatDateTime(operation.endTime)}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium mt-2 sm:mt-0 w-fit ${
                      operation.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      operation.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {operation.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Update Section */}
            {scannedData.canUpdate && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-sm font-medium">Update Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="status" className="text-sm font-medium">
                      New Status
                    </label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Status.PENDING}>PENDING</SelectItem>
                        <SelectItem value={Status.IN_PROGRESS}>IN PROGRESS</SelectItem>
                        <SelectItem value={Status.COMPLETED}>COMPLETED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <label htmlFor="notes" className="text-sm font-medium">
                      Notes (Optional)
                    </label>
                    <Textarea
                      id="notes"
                      placeholder="Add any notes about this status update..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between gap-3">
            <Button variant="outline" onClick={resetScanner} className="w-full sm:w-auto">
              <RefreshCw className="mr-2 h-4 w-4" />
              Scan Another
            </Button>
            {scannedData.canUpdate && (
              <Button 
                onClick={handleUpdateStatus} 
                disabled={!newStatus || isUpdating}
                className="w-full sm:w-auto"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Update Status
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 