import { Metadata } from "next";
import { QRScanner } from "@/components/module/worker/tasks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, CheckCircle, Camera, Upload, Settings } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "QR Scanner | Worker Portal",
  description: "Scan production QR codes to update order status",
};

export default function QRScannerPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">QR Scanner</h2>
          <p className="text-muted-foreground">
            Scan production order QR codes to quickly update their status
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/worker/tasks/operations">
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Task Operations
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <QrCode className="h-5 w-5 text-primary" />
              <CardTitle>Production QR Scanner</CardTitle>
            </div>
            <CardDescription>
              Scan QR codes generated for production orders to update their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QRScanner />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Camera className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">1. Start the scanner</h3>
                    <p className="text-sm text-muted-foreground">
                      Click &quot;Start Camera&quot; to access your device camera for real-time scanning.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <QrCode className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">2. Scan QR code</h3>
                    <p className="text-sm text-muted-foreground">
                      Position the production QR code within the scanner frame. Hold steady until detected.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Upload className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">3. Or upload image</h3>
                    <p className="text-sm text-muted-foreground">
                      Alternatively, upload a photo containing the QR code for processing.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">4. Update status</h3>
                    <p className="text-sm text-muted-foreground">
                      Review order details, select new status, and click &quot;Update Status&quot;.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-2">
                <div className="text-blue-600 mt-0.5">💡</div>
                <div className="text-blue-800 text-sm">
                  <strong>Pro Tips:</strong>
                  <ul className="mt-1 space-y-1 text-blue-700">
                    <li>• Ensure good lighting when scanning QR codes</li>
                    <li>• Keep the camera steady and centered on the code</li>
                    <li>• Try different distances if the QR code isn&apos;t being detected</li>
                    <li>• Use the back camera for better focus when available</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 