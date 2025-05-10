import { Metadata } from "next";
import { QRScanner } from "@/components/module/worker/tasks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode } from "lucide-react";

export const metadata: Metadata = {
  title: "QR Scanner | Worker Portal",
  description: "Scan production QR codes to update order status",
};

export default function QRScannerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">QR Scanner</h2>
        <p className="text-muted-foreground">
          Scan production order QR codes to quickly update their status
        </p>
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
            <div>
              <h3 className="font-semibold text-sm mb-1">1. Start the scanner</h3>
              <p className="text-sm text-muted-foreground">
                Click the &quot;Start Camera&quot; button to access your device camera.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">2. Scan a QR code</h3>
              <p className="text-sm text-muted-foreground">
                Position the production QR code within the scanner frame. Hold steady until it&apos;s detected.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">3. Update production status</h3>
              <p className="text-sm text-muted-foreground">
                After scanning, select the new status and click &quot;Update Status&quot; to record the change.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 