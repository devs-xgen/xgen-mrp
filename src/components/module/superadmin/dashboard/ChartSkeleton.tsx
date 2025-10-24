import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartSkeletonProps {
  title?: string;
  description?: string;
  height?: number;
}

export function ChartSkeleton({ title, description, height = 300 }: ChartSkeletonProps) {
  return (
    <Card>
      <CardHeader>
        {title ? (
          <CardTitle>{title}</CardTitle>
        ) : (
          <Skeleton className="h-6 w-48" />
        )}
        {description ? (
          <CardDescription>{description}</CardDescription>
        ) : (
          <Skeleton className="h-4 w-64 mt-2" />
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className={`w-full h-[${height}px]`} />
          <div className="flex justify-center gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
