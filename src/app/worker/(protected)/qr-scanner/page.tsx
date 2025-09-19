import { Metadata } from "next";
import { QRScanner } from "@/components/module/worker/tasks";
import { Button } from "@/components/ui/button";
import { QrCode, CheckCircle, Camera, Upload, Settings, Info, Lightbulb } from "lucide-react";
import Link from "next/link";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  PageBody,
  SectionCard,
} from "@/components/shared/page-layout";

export const metadata: Metadata = {
  title: "QR Scanner | Worker Portal", 
  description: "Scan production QR codes to update order status",
};

export default function QRScannerPage() {
  return (
    <PageContainer>
      {/* Page Header - Standardized Layout */}
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>QR Scanner</PageTitle>
          <PageDescription>
            Scan production order QR codes to quickly update their status
          </PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <Link href="/worker/tasks/operations">
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Task Operations
            </Button>
          </Link>
        </PageHeaderActions>
      </PageHeader>

      {/* Page Body - Standardized Layout */}
      <PageBody className="space-y-6">
        {/* QR Scanner Section */}
        <SectionCard 
          heading={
            <div className="flex items-center space-x-2">
              <QrCode className="h-5 w-5 text-primary" />
              <span>Production QR Scanner</span>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Scan QR codes generated for production orders to update their status
            </p>
            <QRScanner />
          </div>
        </SectionCard>

        {/* Instructions Section */}
        <SectionCard
          heading={
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-primary" />
              <span>How it works</span>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Camera className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">1. Start the scanner</h3>
                    <p className="text-sm text-muted-foreground">
                      Click "Start Camera" to access your device camera for real-time scanning.
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
              <div className="space-y-4">
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
                      Review order details, select new status, and click "Update Status".
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pro Tips Section */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-blue-800 text-sm">
                  <h4 className="font-semibold mb-2">Pro Tips:</h4>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Ensure good lighting when scanning QR codes</li>
                    <li>• Keep the camera steady and centered on the code</li>
                    <li>• Try different distances if the QR code isn't being detected</li>
                    <li>• Use the back camera for better focus when available</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </PageBody>
    </PageContainer>
  );
} 