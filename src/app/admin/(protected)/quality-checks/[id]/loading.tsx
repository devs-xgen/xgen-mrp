import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/quality-checks">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quality Checks
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-[300px] mb-2" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        <Skeleton className="h-10 w-[120px]" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[180px]" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Skeleton className="h-4 w-[80px] mb-2" />
                <Skeleton className="h-5 w-[120px]" />
              </div>
              <div>
                <Skeleton className="h-4 w-[60px] mb-2" />
                <Skeleton className="h-5 w-[80px]" />
              </div>
            </div>

            <div>
              <Skeleton className="h-4 w-[100px] mb-2" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4 mt-1" />
            </div>

            <div>
              <Skeleton className="h-4 w-[100px] mb-2" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-1/2 mt-1" />
            </div>

            <div>
              <Skeleton className="h-4 w-[60px] mb-2" />
              <Skeleton className="h-5 w-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[160px]" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Skeleton className="h-4 w-[100px] mb-2" />
              <Skeleton className="h-5 w-[200px]" />
            </div>

            <div>
              <Skeleton className="h-4 w-[40px] mb-2" />
              <Skeleton className="h-5 w-[120px]" />
            </div>

            <div>
              <Skeleton className="h-4 w-[120px] mb-2" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-5 w-[180px]" />
                <Skeleton className="h-8 w-[80px]" />
              </div>
            </div>

            <div>
              <Skeleton className="h-4 w-[60px] mb-2" />
              <Skeleton className="h-5 w-[150px]" />
            </div>

            <div>
              <Skeleton className="h-4 w-[90px] mb-2" />
              <Skeleton className="h-5 w-[150px]" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
