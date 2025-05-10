// src/app/worker/(protected)/tasks/page.tsx
import { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, QrCode } from "lucide-react";
import { QRScanner } from "@/components/module/worker/tasks";

export const metadata: Metadata = {
  title: "Worker Tasks",
  description: "Manage your assigned tasks and scan production QR codes",
};

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
        <p className="text-muted-foreground">
          View and manage your assigned tasks
        </p>
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">
            <ClipboardList className="h-4 w-4 mr-2" />
            Task List
          </TabsTrigger>
          <TabsTrigger value="qr-scanner">
            <QrCode className="h-4 w-4 mr-2" />
            QR Scanner
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks" className="space-y-4">
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>My Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center space-x-4">
                    <ClipboardList className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Inventory Verification</h4>
                      <p className="text-sm text-muted-foreground">Due in 2 days</p>
                    </div>
                  </div>
                  <div className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    In Progress
                  </div>
                </div>

                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center space-x-4">
                    <ClipboardList className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Quality Check - Batch A123</h4>
                      <p className="text-sm text-muted-foreground">Due today</p>
                    </div>
                  </div>
                  <div className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                    Urgent
                  </div>
                </div>

                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center space-x-4">
                    <ClipboardList className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Material Restocking</h4>
                      <p className="text-sm text-muted-foreground">Due in 5 days</p>
                    </div>
                  </div>
                  <div className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    Pending
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="qr-scanner">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Production QR Scanner</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Scan a production order QR code to view details and update its status. 
                  Position the QR code within the camera frame.
                </p>
                <QRScanner />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
