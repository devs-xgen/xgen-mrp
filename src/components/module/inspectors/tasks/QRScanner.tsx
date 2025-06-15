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
  MoreVertical 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateTaskStatus } from "@/lib/actions/inspector/tasks";
import { Status } from "@prisma/client";
import { toast } from "@/hooks/use-toast";

interface QRScannerProps {
  onScanSuccess?: (data: ProductionOrderData) => void;
}

interface ProductionOrderData {
  id: string;
  product: string;
  quantity: number;
  status: string;
}

export function QRScanner({ onScanSuccess }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ProductionOrderData | null>(null);
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
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
        // First check if we have media devices API available
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          setPermissionError("Media Devices API not supported in your browser. Try the image upload option instead.");
          console.error("Media Devices API not available");
          return;
        }

        // Try to access cameras directly via getUserMedia first to trigger permission prompt
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          // Stop all tracks immediately to release the camera
          stream.getTracks().forEach(track => track.stop());
          console.log("Camera permission granted");
        } catch (permissionErr) {
          console.error("Camera permission error:", permissionErr);
          // We'll continue trying to enumerate devices anyway
        }

        // Try Html5Qrcode's camera access method
        const devices = await Html5Qrcode.getCameras();
        console.log("Detected cameras:", devices);
        
        if (devices && devices.length) {
          setCameras(devices);
          setCameraId(devices[0].id); // Select first camera by default
        } else {
          // Fallback to manual enumeration if Html5Qrcode failed
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          console.log("All media devices:", allDevices);
          
          const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
          
          if (videoDevices.length > 0) {
            const formattedDevices = videoDevices.map(device => ({
              id: device.deviceId,
              label: device.label || `Camera ${device.deviceId.slice(0, 5)}`
            }));
            
            console.log("Manually detected cameras:", formattedDevices);
            setCameras(formattedDevices);
            setCameraId(formattedDevices[0].id);
          } else {
            setPermissionError("No cameras found. Please ensure your device has a camera and you've granted permission.");
          }
        }
      } catch (err) {
        console.error("Error getting cameras:", err);
        setPermissionError("Unable to access cameras. Please check your camera permissions in browser settings or try the image upload option.");
      }
    };
    
    getCameras();
  }, []);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode
          .stop()
          .catch((error: Error) => console.error("Error stopping scanner:", error));
      }
    };
  }, [html5QrCode]);

  const startScanner = async () => {
    setIsScanning(true);
    setPermissionError("");
    
    try {
      const scanner = new Html5Qrcode("qr-reader");
      setHtml5QrCode(scanner);
      
      const qrCodeSuccessCallback = (decodedText: string) => {
        try {
          // For development if scanning is an issue, uncomment this for testing
          /*
          setTimeout(() => {
            const sampleData = {
              id: "PO-2023-001",
              product: "Sample Product",
              quantity: 100,
              status: "PENDING"
            };
            setScannedData(sampleData);
            if (onScanSuccess) onScanSuccess(sampleData);
            stopScanner();
            
            toast({
              title: "QR Code Scanned (Test)",
              description: `Test production order detected`,
            });
          }, 2000);
          return;
          */
          
          // Parse the QR code data
          const parsedData = JSON.parse(decodedText) as ProductionOrderData;
          setScannedData(parsedData);
          if (onScanSuccess) onScanSuccess(parsedData);
          stopScanner();
          
          toast({
            title: "QR Code Scanned",
            description: `Production order ${parsedData.id} detected`,
          });
        } catch (error: unknown) {
          toast({
            title: "Invalid QR Code",
            description: "The scanned QR code is not in the correct format.",
            variant: "destructive",
          });
        }
      };
      
      const qrCodeErrorCallback = (errorMessage: string) => {
        // Ignore general scanning errors but log them for debugging
        console.log("QR scanning error:", errorMessage);
      };
      
      // More flexible config with lower frame rate for better compatibility
      const config = { 
        fps: 5, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
        verbose: true // Enable verbose logging
      };
      
      // Try multiple camera access methods
      const tryCamera = async () => {
        console.log("Attempting to start camera:", cameraId || "environment");
        
        // Use selected camera or environment camera if no selection
        const cameraConfig = cameraId 
          ? { deviceId: cameraId }
          : { facingMode: "environment" };
        
        try {
          await scanner.start(
            cameraConfig,
            config,
            qrCodeSuccessCallback,
            qrCodeErrorCallback
          );
          console.log("Camera started successfully");
          setPermissionError("");
        } catch (cameraError: any) {
          console.error("Camera start error:", cameraError);
          
          // First fallback - try user facing camera
          if (!cameraId || cameraConfig.facingMode === "environment") {
            try {
              console.log("Trying user-facing camera instead");
              setPermissionError("Trying front camera instead...");
              await scanner.start(
                { facingMode: "user" },
                config,
                qrCodeSuccessCallback,
                qrCodeErrorCallback
              );
              console.log("Front camera started successfully");
              setPermissionError("");
              return;
            } catch (frontError) {
              console.error("Front camera error:", frontError);
            }
          }
          
          // Second fallback - try with a different camera if we have multiple
          if (cameras.length > 1) {
            try {
              // Try a different camera than the current one
              const backupCameraId = cameras.find(cam => cam.id !== cameraId)?.id;
              if (backupCameraId) {
                console.log("Trying alternative camera:", backupCameraId);
                setPermissionError("Trying alternative camera...");
                await scanner.start(
                  { deviceId: backupCameraId },
                  config,
                  qrCodeSuccessCallback,
                  qrCodeErrorCallback
                );
                console.log("Alternative camera started successfully");
                setPermissionError("");
                return;
              }
            } catch (altCameraError) {
              console.error("Alternative camera error:", altCameraError);
            }
          }
          
          // Final fallback - try with minimal config
          try {
            console.log("Trying with minimal constraints as final fallback");
            setPermissionError("Trying final camera configuration...");
            
            // Use a simplified config for the final attempt
            const simpleConfig = {
              fps: 2,
              qrbox: { width: 200, height: 200 },
            };
            
            await scanner.start(
              { facingMode: "environment" },
              simpleConfig,
              qrCodeSuccessCallback,
              qrCodeErrorCallback
            );
            console.log("Camera started with minimal constraints");
            setPermissionError("");
          } catch (finalError) {
            console.error("All camera fallbacks failed:", finalError);
            handleCameraError(finalError);
          }
        }
      };
      
      await tryCamera();
    } catch (error: unknown) {
      console.error("Error starting scanner:", error);
      setIsScanning(false);
      handleCameraError(error);
    }
  };

  const handleCameraError = (error: any) => {
    setIsScanning(false);
    console.error("Camera error:", error);
    
    let errorMessage = "Could not access the camera. Please check permissions and try again.";
    
    // Extract more specific error if available
    if (error.message) {
      if (error.message.includes("Permission denied") || error.message.includes("permission")) {
        errorMessage = "Camera access denied. Please allow camera access in your browser settings.";
      } else if (error.message.includes("NotFoundError") || error.message.includes("not found")) {
        errorMessage = "No camera found on your device.";
      } else if (error.message.includes("NotReadableError") || error.message.includes("could not be started")) {
        errorMessage = "Camera is in use by another application or not available.";
      }
    }
    
    setPermissionError(errorMessage);
    
    toast({
      title: "Camera Error",
      description: errorMessage,
      variant: "destructive",
    });
  };

  const stopScanner = () => {
    if (html5QrCode && html5QrCode.isScanning) {
      html5QrCode
        .stop()
        .then(() => {
          setIsScanning(false);
        })
        .catch((error: Error) => {
          console.error("Error stopping scanner:", error);
        });
    } else {
      setIsScanning(false);
    }
  };

  const resetScanner = () => {
    setScannedData(null);
    setNewStatus("");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file (jpg, png, etc.)",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingImage(true);

    try {
      // Create a temporary scanner
      const scanner = new Html5Qrcode("qr-file-reader");
      
      // Convert image to data URL
      const fileReader = new FileReader();
      
      fileReader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        
        try {
          // Scan the QR code from the image
          const result = await scanner.scanFile(file, /* showImage */ false);
          
          try {
            // Parse the result
            const parsedData = JSON.parse(result) as ProductionOrderData;
            setScannedData(parsedData);
            if (onScanSuccess) onScanSuccess(parsedData);
            
            toast({
              title: "QR Code Detected in Image",
              description: `Production order ${parsedData.id} found`,
            });
          } catch (parseError) {
            toast({
              title: "Invalid QR Code Format",
              description: "The QR code in the image is not in the expected format.",
              variant: "destructive",
            });
          }
        } catch (scanError) {
          console.error("Scan error:", scanError);
          toast({
            title: "No QR Code Found",
            description: "No valid QR code could be detected in the uploaded image.",
            variant: "destructive",
          });
        } finally {
          setIsProcessingImage(false);
          // Reset the file input to allow selecting the same file again
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      
      fileReader.onerror = () => {
        toast({
          title: "File Reading Error",
          description: "There was a problem reading the image file.",
          variant: "destructive",
        });
        setIsProcessingImage(false);
      };
      
      fileReader.readAsDataURL(file);
      
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Processing Error",
        description: "Could not process the image. Please try a different image.",
        variant: "destructive",
      });
      setIsProcessingImage(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!scannedData || !newStatus) return;

    setIsUpdating(true);
    try {
      // This is a production order ID, not an operation ID
      // We need to update operations related to this production order
      await fetch(`/api/inspectors/production-order/${scannedData.id}/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus as Status,
          notes: `Status updated via QR scan by worker at ${new Date().toLocaleString()}`
        })
      });

      toast({
        title: "Status Updated",
        description: `Production order status updated to ${newStatus}`,
      });
      
      resetScanner();
      router.refresh();
    } catch (error: unknown) {
      console.error("Error updating status:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update production order status.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // For testing when camera is not available
  const simulateScan = () => {
    const sampleData = {
      id: "PO-2023-001",
      product: "Sample Product",
      quantity: 100,
      status: "PENDING"
    };
    setScannedData(sampleData);
    if (onScanSuccess) onScanSuccess(sampleData);
    
    toast({
      title: "Test QR Code Scanned",
      description: `Test production order detected`,
    });
  };

  return (
    <div className="w-full">
      {!scannedData ? (
        <Card>
          <CardHeader>
            <CardTitle>QR Code Scanner</CardTitle>
            <CardDescription>
              Scan a production order QR code to update its status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="camera" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="camera" className="flex items-center">
                  <Camera className="mr-2 h-4 w-4" />
                  Use Camera
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="camera">
                <div className="flex flex-col items-center">
                  {isScanning ? (
                    <div className="w-full max-w-md relative">
                      <div 
                        id="qr-reader" 
                        className="w-full h-64 md:h-80 bg-muted relative overflow-hidden rounded-md"
                      ></div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute bottom-4 right-4"
                        onClick={stopScanner}
                      >
                        <StopCircle className="mr-2 h-4 w-4" />
                        Stop Scanning
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-md w-full max-w-md h-64 mb-4">
                      <Camera className="h-10 w-10 text-muted-foreground mb-4" />
                      <p className="text-center text-muted-foreground mb-4">
                        Tap the button below to start scanning a QR code
                      </p>
                      
                      {permissionError && (
                        <div className="text-center text-sm text-destructive mb-4 p-2 bg-destructive/10 rounded-md">
                          {permissionError}
                        </div>
                      )}
                      
                      {cameras.length > 1 && (
                        <div className="w-full mb-4">
                          <label htmlFor="camera" className="text-sm font-medium mb-2 block">
                            Select Camera:
                          </label>
                          <Select
                            value={cameraId}
                            onValueChange={setCameraId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select camera" />
                            </SelectTrigger>
                            <SelectContent>
                              {cameras.map((camera) => (
                                <SelectItem key={camera.id} value={camera.id}>
                                  {camera.label || `Camera ${camera.id}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button onClick={startScanner}>
                          <Camera className="mr-2 h-4 w-4" />
                          Start Camera
                        </Button>
                        
                        {(process.env.NODE_ENV === 'development' || permissionError) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={simulateScan}>
                                <Scan className="mr-2 h-4 w-4" />
                                Simulate Scan
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={async () => {
                                  try {
                                    // Display current permissions state
                                    const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
                                    
                                    // Get all media devices
                                    const devices = await navigator.mediaDevices.enumerateDevices();
                                    const videoDevices = devices.filter(device => device.kind === 'videoinput');
                                    
                                    // Create debug message
                                    const debugInfo = {
                                      browserUserAgent: navigator.userAgent,
                                      cameraPermission: permissionStatus.state,
                                      detectedCameras: videoDevices.length,
                                      cameraDetails: videoDevices.map(d => ({
                                        id: d.deviceId.substring(0, 8) + '...',
                                        label: d.label || 'Unnamed camera'
                                      })),
                                      secureContext: window.isSecureContext,
                                      https: window.location.protocol === 'https:'
                                    };
                                    
                                    console.log('Camera debug info:', debugInfo);
                                    
                                    toast({
                                      title: "Camera Debug Info",
                                      description: `Cameras: ${videoDevices.length}, Permission: ${permissionStatus.state}, HTTPS: ${window.location.protocol === 'https:'}`,
                                    });
                                  } catch (error) {
                                    console.error('Error getting debug info:', error);
                                    toast({
                                      title: "Debug Error",
                                      description: "Failed to get camera debug information.",
                                      variant: "destructive"
                                    });
                                  }
                                }}
                              >
                                <span className="mr-2">🔍</span>
                                Debug Camera
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="upload">
                <div className="flex flex-col items-center">
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-md w-full max-w-md h-64 mb-4">
                    {isProcessingImage ? (
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                        <p className="text-center text-muted-foreground">
                          Processing image...
                        </p>
                      </div>
                    ) : (
                      <>
                        <Image className="h-10 w-10 text-muted-foreground mb-4" />
                        <p className="text-center text-muted-foreground mb-4">
                          Upload an image containing a QR code
                        </p>
                        
                        <div className="hidden">
                          <div id="qr-file-reader" style={{ display: 'none' }}></div>
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
                          className="flex items-center"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Choose Image
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    <p>Supported file types: JPG, PNG, GIF</p>
                    <p className="mt-1">Make sure the QR code is clearly visible in the image</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Production Order Details</CardTitle>
            <CardDescription>
              Update the status of this production order
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">Order ID</p>
                <p className="text-sm">{scannedData.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Quantity</p>
                <p className="text-sm">{scannedData.quantity}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Product</p>
                <p className="text-sm">{scannedData.product}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Current Status</p>
                <p className="text-sm">{scannedData.status}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Update Status
              </label>
              <Select
                value={newStatus}
                onValueChange={setNewStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Status.PENDING}>PENDING</SelectItem>
                  <SelectItem value={Status.IN_PROGRESS}>IN PROGRESS</SelectItem>
                  <SelectItem value={Status.COMPLETED}>COMPLETED</SelectItem>
                  <SelectItem value="ON_HOLD">ON HOLD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={resetScanner}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Scan Another
            </Button>
            <Button 
              onClick={handleUpdateStatus} 
              disabled={!newStatus || isUpdating}
            >
              {isUpdating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Update Status
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 