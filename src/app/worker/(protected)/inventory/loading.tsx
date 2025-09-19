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
          <Skeleton className="h-9 w-[180px]" />
          <Skeleton className="h-4 w-[350px] mt-2" />
        </PageHeaderMain>
        <PageHeaderActions>
          <Skeleton className="h-10 w-[120px]" />
        </PageHeaderActions>
      </PageHeader>

      {/* Page Body Skeleton */}
      <PageBody className="space-y-6">
        {/* Inventory Overview Skeleton */}
        <SectionCard heading={<Skeleton className="h-6 w-[150px]" />}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-8 w-[60px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-3 w-[80px]" />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Tabs Skeleton */}
        <div className="space-y-6">
          <div className="flex space-x-1">
            <Skeleton className="h-10 w-[140px]" />
            <Skeleton className="h-10 w-[140px]" />
          </div>
          
          {/* Materials Table Skeleton */}
          <SectionCard heading={<Skeleton className="h-6 w-[120px]" />}>
            <div className="space-y-4">
              {/* Table Header */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-[300px]" />
                <Skeleton className="h-10 w-[120px]" />
              </div>
              
              {/* Table Rows */}
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border rounded">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-6 w-[80px]" />
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-8 w-[40px]" />
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-[200px]" />
                <div className="flex space-x-2">
                  <Skeleton className="h-10 w-[80px]" />
                  <Skeleton className="h-10 w-[40px]" />
                  <Skeleton className="h-10 w-[40px]" />
                  <Skeleton className="h-10 w-[80px]" />
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </PageBody>
    </PageContainer>
  );
}
