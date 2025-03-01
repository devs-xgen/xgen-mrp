import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-8 w-[250px] mb-2" />
          <Skeleton className="h-4 w-[350px]" />
        </div>
        <Skeleton className="h-10 w-[150px]" />
      </div>

      {/* Metrics skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-[120px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px] mb-2" />
              <Skeleton className="h-4 w-[100px]" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent checks skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[150px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b pb-3"
              >
                <div>
                  <Skeleton className="h-5 w-[200px] mb-2" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-[100px]" />
                  <Skeleton className="h-6 w-[80px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[120px]" />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="h-10 border-b bg-muted/30 px-4 flex items-center">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-5 w-[150px]" />
              </div>
            </div>
            <div className="bg-white">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="border-b px-4 py-4 flex justify-between items-center"
                >
                  <div className="flex-1">
                    <Skeleton className="h-5 w-full max-w-[300px]" />
                  </div>
                  <div className="flex-1">
                    <Skeleton className="h-5 w-full max-w-[100px]" />
                  </div>
                  <div className="flex-1">
                    <Skeleton className="h-5 w-full max-w-[100px]" />
                  </div>
                  <div className="flex-1">
                    <Skeleton className="h-5 w-full max-w-[80px]" />
                  </div>
                  <div className="flex-1">
                    <Skeleton className="h-5 w-full max-w-[120px]" />
                  </div>
                  <div className="w-[40px]">
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
