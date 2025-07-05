import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Skeleton className="h-9 w-[150px]" />
          <Skeleton className="h-4 w-[300px] mt-2" />
        </div>
        <Skeleton className="h-10 w-[140px]" />
      </div>

      {/* Task List Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[100px]" />
        </CardHeader>
        <CardContent>
          {/* Tabs */}
          <div className="mb-4 flex flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-[120px]" />
            ))}
          </div>

          {/* Task Cards */}
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="border">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-[200px]" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-[80px]" />
                        <Skeleton className="h-5 w-[70px]" />
                        <Skeleton className="h-4 w-[120px]" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-[100px]" />
                      <Skeleton className="h-5 w-[60px]" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-[100px]" />
                      <Skeleton className="h-8 w-[80px]" />
                      <Skeleton className="h-8 w-[110px]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 