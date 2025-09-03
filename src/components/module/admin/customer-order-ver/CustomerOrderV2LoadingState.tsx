"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageBody,
} from "@/components/shared/page-layout";

export function CustomerOrderV2LoadingState() {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Customer Orders V2</PageTitle>
          <PageDescription>
            Enhanced customer order management with advanced features, real-time fulfillment tracking, and integrated production planning
          </PageDescription>
        </PageHeaderMain>
      </PageHeader>

      <PageBody>
        <div className="space-y-6">
          {/* Header Actions Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-40" /> {/* Search */}
              <Skeleton className="h-10 w-32" /> {/* Filter */}
              <Skeleton className="h-10 w-32" /> {/* Status */}
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-24" /> {/* Export */}
              <Skeleton className="h-10 w-32" /> {/* Create Order */}
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4 rounded" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters Bar Skeleton */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <Skeleton className="h-9 w-48" /> {/* Search input */}
            <Skeleton className="h-9 w-32" /> {/* Status filter */}
            <Skeleton className="h-9 w-32" /> {/* Customer filter */}
            <Skeleton className="h-9 w-32" /> {/* Date filter */}
            <Skeleton className="h-9 w-24" /> {/* Clear filters */}
          </div>

          {/* Table Skeleton */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-24" /> {/* View options */}
                  <Skeleton className="h-9 w-20" /> {/* Pagination */}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Table Header */}
              <div className="grid grid-cols-8 gap-4 p-4 border-b border-border">
                <Skeleton className="h-4 w-4" /> {/* Checkbox */}
                <Skeleton className="h-4 w-24" /> {/* Order Number */}
                <Skeleton className="h-4 w-32" /> {/* Customer */}
                <Skeleton className="h-4 w-20" /> {/* Date */}
                <Skeleton className="h-4 w-16" /> {/* Status */}
                <Skeleton className="h-4 w-20" /> {/* Amount */}
                <Skeleton className="h-4 w-24" /> {/* Fulfillment */}
                <Skeleton className="h-4 w-16" /> {/* Actions */}
              </div>

              {/* Table Rows */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="grid grid-cols-8 gap-4 p-4 border-b border-border/50">
                  <Skeleton className="h-4 w-4" /> {/* Checkbox */}
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" /> {/* Status badge */}
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-18" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-2 w-16" /> {/* Progress bar */}
                      <Skeleton className="h-3 w-8" />
                    </div>
                    <div className="flex gap-1">
                      <Skeleton className="h-4 w-12 rounded-full" />
                      <Skeleton className="h-4 w-16 rounded-full" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 rounded" /> {/* Actions menu */}
                </div>
              ))}

              {/* Table Footer */}
              <div className="flex items-center justify-between p-4 border-t">
                <Skeleton className="h-4 w-40" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-16" />
                  <Skeleton className="h-9 w-16" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PageBody>
    </PageContainer>
  );
}

// Alternative simpler loading state without the full page layout
export function CustomerOrderV2TableLoadingState() {
  return (
    <div className="space-y-6">
      {/* Header Actions Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Filters Skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table Skeleton */}
      <Card>
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-8 gap-4 p-4 border-b">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
          
          {/* Table Rows */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="grid grid-cols-8 gap-4 p-4 border-b border-border/50">
              {Array.from({ length: 8 }).map((_, j) => (
                <div key={j} className="space-y-1">
                  <Skeleton className="h-4 w-full" />
                  {j < 3 && <Skeleton className="h-3 w-3/4" />}
                </div>
              ))}
            </div>
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t">
            <Skeleton className="h-4 w-40" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
