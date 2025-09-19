import { Skeleton } from "@/components/ui/skeleton";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageHeaderActions,
  PageBody,
  SectionCard,
} from "@/components/shared/page-layout";

export default function Loading() {
  return (
    <PageContainer>
      {/* Page Header Skeleton */}
      <PageHeader>
        <PageHeaderMain>
          <Skeleton className="h-9 w-[150px]" />
          <Skeleton className="h-4 w-[300px] mt-2" />
        </PageHeaderMain>
        <PageHeaderActions>
          <Skeleton className="h-10 w-[140px]" />
        </PageHeaderActions>
      </PageHeader>

      {/* Page Body Skeleton */}
      <PageBody className="space-y-6">
        {/* QR Scanner Section Skeleton */}
        <SectionCard heading={<Skeleton className="h-6 w-[200px]" />}>
          <div className="space-y-4">
            <Skeleton className="h-4 w-[350px]" />
            
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
        </SectionCard>

        {/* Instructions Section Skeleton */}
        <SectionCard heading={<Skeleton className="h-6 w-[140px]" />}>
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[120px]" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[120px]" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Pro Tips Section Skeleton */}
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-start space-x-3">
                <Skeleton className="h-5 w-5 flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[100px]" />
                  <div className="space-y-1">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-3 w-full" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </PageBody>
    </PageContainer>
  );
} 