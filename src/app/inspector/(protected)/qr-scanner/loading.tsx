import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-9 w-[150px]" />
        <Skeleton className="h-4 w-[300px] mt-2" />
      </div>

      {/* QR Scanner Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[120px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Scanner Area */}
            <div className="flex justify-center">
              <Skeleton className="h-64 w-64 rounded-lg" />
            </div>
            
            {/* Controls */}
            <div className="flex justify-center gap-2">
              <Skeleton className="h-10 w-[120px]" />
              <Skeleton className="h-10 w-[100px]" />
            </div>
            
            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center space-y-2">
                <Skeleton className="h-12 w-12 rounded-full mx-auto" />
                <Skeleton className="h-5 w-[200px] mx-auto" />
                <Skeleton className="h-4 w-[250px] mx-auto" />
                <Skeleton className="h-10 w-[150px] mx-auto" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Scans */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[120px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[180px]" />
                  <Skeleton className="h-3 w-[120px]" />
                </div>
                <Skeleton className="h-8 w-[80px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 