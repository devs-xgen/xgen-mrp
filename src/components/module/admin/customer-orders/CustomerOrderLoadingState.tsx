"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  SectionCard,
} from "@/components/shared/page-layout";

export function CustomerOrderLoadingState() {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Customer Orders</PageTitle>
          <PageDescription>
            Loading customer orders and production planning data...
          </PageDescription>
        </PageHeaderMain>
      </PageHeader>

      <SectionCard heading="Loading Customer Orders">
        <div className="space-y-4">
          {/* Table header skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          
          {/* Table rows skeleton */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </SectionCard>
    </PageContainer>
  );
}

export function CustomerOrderDetailsLoadingState() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="space-y-4">
        <Skeleton className="h-6 w-64" />
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="space-y-4">
          <div className="flex space-x-1 border-b">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-20" />
            ))}
          </div>
          
          {/* Tab content */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="grid grid-cols-2 gap-4">
                        <div>
                          <Skeleton className="h-4 w-20 mb-1" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-20 mb-1" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-4 w-8" />
                          <div>
                            <Skeleton className="h-5 w-48 mb-1" />
                            <Skeleton className="h-4 w-64" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Skeleton className="h-5 w-20 mb-1" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-2 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
