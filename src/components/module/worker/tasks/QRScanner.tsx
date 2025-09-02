"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Loader2,
  AlertCircle
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
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  // Core scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ProductionOrderDetails | null>(null);
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  
  // Form state
  const [newStatus, setNewStatus] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  
  // Camera state
  const [cameraId, setCameraId] = useState<string>("");
  const [cameras, setCameras] = useState<{id: string, label: string}[]>([]);
  const [permissionError, setPermissionError] = useState<string>("");
  
  // Scan tracking to prevent duplicates
  const [lastScannedId, setLastScannedId] = useState<string>("");
  const [scanInProgress, setScanInProgress] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout>();
  const toastTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Router for navigation (but we won't use refresh)
  const router = useRouter();

  // Cleanup function
  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [html5QrCode]);

  // Debounced toast to prevent spam
  const showToast = useCallback((title: string, description: string, variant?: "default" | "destructive") => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    
    toastTimeoutRef.current = setTimeout(() => {
      toast({ title, description, variant });
    }, 300); // Longer delay to prevent spam
  }, []);

  // Memoized fetch function to prevent recreation
  const fetchProductionOrderDetails = useCallback(async (productionOrderId: string): Promise<ProductionOrderDetails | null> => {
    try {
      console.log("Fetching production order:", productionOrderId);
      
      const response = await fetch(`/api/worker/production-order/${productionOrderId}/details`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.error || `HTTP ${response.status}`;
        
        if (response.status === 400 && errorMessage.includes("not assigned to any work centers")) {
          errorMessage = "You are not assigned to any work centers. Please contact your supervisor.";
        } else if (response.status === 403) {
          errorMessage = "You don't have access to this production order. It may be assigned to different work centers.";
        } else if (response.status === 404) {
          errorMessage = "Production order not found. Please check the QR code.";
        } else if (response.status === 401) {
          errorMessage = "Please log in again to access production orders.";
        }
        
        showToast("Error", errorMessage, "destructive");
        return null;
      }

      const data = await response.json();
      console.log("Successfully fetched production order data:", data);
      return data;
    } catch (error: any) {
      console.error("Network error fetching production order:", error);
      showToast("Network Error", "Failed to fetch production order details. Please check your connection.", "destructive");
      return null;
    }
  }, [showToast]);

  // Process scanned QR code with proper debouncing
  const processScannedCode = useCallback(async (scannedText: string) => {
    console.log("Processing scanned text:", scannedText);
    
    // Prevent processing if already in progress or same code
    if (scanInProgress || scannedText === lastScannedId) {
      console.log("Scan already in progress or duplicate, ignoring...");
      return;
    }
    
    setScanInProgress(true);
    setLastScannedId(scannedText);
    setIsLoading(true);
    
    try {
      let productionOrderId: string;

      // Parse QR code data
      try {
        const jsonData = JSON.parse(scannedText);
        productionOrderId = jsonData.id || jsonData.productionOrderId || jsonData.orderId;
      } catch {
        productionOrderId = scannedText.trim();
      }

      if (!productionOrderId) {
        showToast("Invalid QR Code", "Could not extract production order ID from QR code", "destructive");
        return;
      }

      console.log("Processing production order ID:", productionOrderId);
      
      // Single toast for scanning
      showToast("QR Code Scanned", `Processing production order: ${productionOrderId}`);

      // Fetch production order details
      const details = await fetchProductionOrderDetails(productionOrderId);
      
      if (details) {
        setScannedData(details);
        setUpdateSuccess(false);
        setNewStatus("");
        setNotes("");
        
        // Only call onScanSuccess if provided
        if (onScanSuccess) {
          onScanSuccess(details);
        }
        
        // Single success toast
        showToast("Success", `Found: ${details.product.name} (${details.operations.length} operations)`);
      }
    } catch (error: any) {
      console.error("Error processing scanned code:", error);
      showToast("Processing Error", "Failed to process QR code", "destructive");
    } finally {
      setIsLoading(false);
      setScanInProgress(false);
    }
  }, [scanInProgress, lastScannedId, fetchProductionOrderDetails, onScanSuccess, showToast]);

  // Camera initialization
  const initializeCameras = useCallback(async () => {
    try {
      console.log("Initializing cameras...");
      
      // Check security requirements
      const isSecure = window.location.protocol === 'https:' || 
                      window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
      
      if (!isSecure) {
        setPermissionError("Camera access requires HTTPS or localhost");
        return;
      }

      // Check API support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setPermissionError("Camera API not supported in this browser");
        return;
      }

      // Request permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      }).catch(() => 
        navigator.mediaDevices.getUserMedia({ video: true })
      );
      
      // Stop permission stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      
      if (devices && devices.length > 0) {
        setCameras(devices);
        
        // Prefer back camera
        const backCamera = devices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );
        
        setCameraId((backCamera || devices[0]).id);
        setPermissionError("");
      } else {
        setPermissionError("No cameras detected on this device");
      }
    } catch (error: any) {
      console.error("Camera initialization error:", error);
      
      let errorMessage = "Camera access failed: ";
      if (error.name === 'NotAllowedError') {
        errorMessage += "Permission denied. Please allow camera access.";
      } else if (error.name === 'NotFoundError') {
        errorMessage += "No camera found.";
      } else if (error.name === 'NotReadableError') {
        errorMessage += "Camera is in use by another application.";
      } else {
        errorMessage += error.message || "Unknown error.";
      }
      
      setPermissionError(errorMessage);
    }
  }, []);

  // Initialize cameras on mount
  useEffect(() => {
    initializeCameras();
  }, [initializeCameras]);

  // Start scanner
  const startScanner = useCallback(async () => {
    if (!cameraId) {
      showToast("No Camera", "Please select a camera first", "destructive");
      return;
    }

    if (isScanning) {
      console.log("Scanner already running");
      return;
    }

    setIsScanning(true);
    setPermissionError("");
    setLastScannedId("");
    setScanInProgress(false);
    
    try {
      // Wait for DOM
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const qrReaderElement = document.getElementById("qr-reader");
      if (!qrReaderElement) {
        throw new Error("QR reader element not found");
      }
      
      const scanner = new Html5Qrcode("qr-reader");
      setHtml5QrCode(scanner);
      
      // Success callback
      const onScanSuccess = async (decodedText: string) => {
        console.log("QR Code detected:", decodedText);
        
        // Stop scanner first
        try {
          await scanner.stop();
          setIsScanning(false);
          setHtml5QrCode(null);
        } catch (stopError) {
          console.warn("Error stopping scanner:", stopError);
        }
        
        // Process the scan
        await processScannedCode(decodedText);
      };
      
      // Error callback (suppress normal scanning noise)
      const onScanFailure = (error: string) => {
        if (!error.includes("No QR code found") && 
            !error.includes("NotFoundException") && 
            !error.includes("No MultiFormat Readers")) {
          console.log("QR scan error:", error);
        }
      };
      
      // Start with simple config
      await scanner.start(
        { deviceId: cameraId },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          disableFlip: false,
        },
        onScanSuccess,
        onScanFailure
      );
      
      console.log("Scanner started successfully");
      
    } catch (error: any) {
      console.error("Scanner start error:", error);
      setIsScanning(false);
      setHtml5QrCode(null);
      
      let errorMessage = "Failed to start camera: ";
      if (error.name === 'NotAllowedError') {
        errorMessage += "Permission denied. Please allow camera access.";
      } else if (error.name === 'NotFoundError') {
        errorMessage += "Camera not found.";
      } else if (error.name === 'NotReadableError') {
        errorMessage += "Camera is in use by another application.";
      } else {
        errorMessage += error.message || "Unknown error.";
      }
      
      setPermissionError(errorMessage);
      showToast("Camera Error", errorMessage, "destructive");
    }
  }, [cameraId, isScanning, processScannedCode, showToast]);

  // Stop scanner
  const stopScanner = useCallback(async () => {
    if (html5QrCode && html5QrCode.isScanning) {
      try {
        await html5QrCode.stop();
      } catch (error) {
        console.warn("Error stopping scanner:", error);
      }
    }
    setIsScanning(false);
    setHtml5QrCode(null);
  }, [html5QrCode]);

  // Reset scanner
  const resetScanner = useCallback(() => {
    setScannedData(null);
    setNewStatus("");
    setNotes("");
    setUpdateSuccess(false);
    setLastScannedId("");
    setScanInProgress(false);
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setIsProcessingImage(true);

  try {
    // Convert file to base64 data URL
    const fileReader = new FileReader();
    fileReader.onload = async (e) => {
      const dataUrl = e.target?.result as string;

      // Create a scanner instance or reuse existing
      const scanner = html5QrCode ?? new Html5Qrcode("qr-file-reader");
      if (!html5QrCode) setHtml5QrCode(scanner);

      try {
        // Pass data URL to scanFile
        const result = await scanner.scanFile(dataUrl, true);
        await processScannedCode(result);
      } catch (scanError) {
        console.error("File scan error:", scanError);
        showToast("Scan Failed", "Could not detect QR code in the uploaded image", "destructive");
      } finally {
        setIsProcessingImage(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    fileReader.onerror = () => {
      setIsProcessingImage(false);
      showToast("File Error", "Failed to read the selected file. Please try again.", "destructive");
    };

    fileReader.readAsDataURL(file);

  } catch (error) {
    console.error("Error processing file upload:", error);
    setIsProcessingImage(false);
    showToast("Scan Failed", "Could not process the uploaded image", "destructive");
  }
}, [html5QrCode, processScannedCode, showToast]);


  // Development test function
  const simulateScan = useCallback(async () => {
    const testId = "test-production-order-001";
    showToast("Development Test", `Testing with ID: ${testId}`);
    await processScannedCode(testId);
  }, [processScannedCode, showToast]);

  // Utility functions
  const formatDateTime = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Memoized status options
  const statusOptions = useMemo(() => [
    { value: Status.PENDING, label: "PENDING" },
    { value: Status.IN_PROGRESS, label: "IN PROGRESS" },
    { value: Status.COMPLETED, label: "COMPLETED" },
  ], []);

  // Loading state
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
                <TabsTrigger value="camera" className="flex items-center justify-center gap-2">
                  <Camera className="h-4 w-4" />
                  <span className="hidden sm:inline">Use Camera</span>
                  <span className="sm:hidden">Camera</span>
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center justify-center gap-2">
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Upload Image</span>
                  <span className="sm:hidden">Upload</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="camera" className="space-y-4">
                <div className="flex flex-col items-center">
                  {isScanning ? (
                    <div className="w-full max-w-lg relative">
                      <div 
                        id="qr-reader" 
                        className="w-full h-64 sm:h-80 md:h-96 bg-muted relative overflow-hidden rounded-lg border-2 border-primary/20"
                      />
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
                      <div className="flex flex-col items-center justify-center p-8 md:p-12 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/50 min-h-[16rem] md:min-h-[20rem]">
                        <Camera className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
                        <p className="text-center text-muted-foreground mb-6 text-sm md:text-base max-w-sm">
                          Position a production order QR code in the camera view
                        </p>
                        
                        {permissionError && (
                          <div className="w-full mb-6">
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="mt-2">
                                <div className="font-medium mb-2">Camera Access Issue</div>
                                <div className="text-sm mb-4">{permissionError}</div>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={initializeCameras}
                                  className="w-full"
                                >
                                  <RefreshCw className="mr-2 h-3 w-3" />
                                  Retry Camera Access
                                </Button>
                              </AlertDescription>
                            </Alert>
                          </div>
                        )}
                        
                        {cameras.length > 1 && (
                          <div className="w-full mb-6">
                            <label className="text-sm font-medium mb-2 block">Select Camera:</label>
                            <Select value={cameraId} onValueChange={setCameraId}>
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
                        
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                          <Button 
                            onClick={startScanner} 
                            disabled={!cameraId || isScanning}
                            size="lg"
                            className="flex-1"
                          >
                            <Camera className="mr-2 h-5 w-5" />
                            {isScanning ? "Starting..." : "Start Camera"}
                          </Button>
                          
                          {process.env.NODE_ENV === 'development' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="lg">
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
                            <div id="qr-file-reader" />
                          </div>
                          
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
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
            {updateSuccess && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Status updated successfully! The production order status has been changed.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Order ID</p>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{scannedData.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Current Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  scannedData.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  scannedData.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                  scannedData.status === 'PENDING' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {scannedData.status}
                </span>
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

            {scannedData.canUpdate && !updateSuccess && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-sm font-medium">Update Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">New Status</label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes (Optional)</label>
                    <Textarea
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
            {scannedData.canUpdate && !updateSuccess && (
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