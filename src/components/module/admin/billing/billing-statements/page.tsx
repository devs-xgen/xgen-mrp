import { Suspense } from "react"
import { BillingStatementsClient } from "./billing-statements-client"
import { ManualBillingDialog } from "../manual-billing-dialog"

interface BillingStatementsTableSkeletonProps {}

export function BillingStatementsTableSkeleton({}: BillingStatementsTableSkeletonProps) {
  return (
    <div className="space-y-4">
      <div className="h-8 w-full bg-muted animate-pulse rounded" />
      <div className="h-64 w-full bg-muted animate-pulse rounded" />
    </div>
  )
}

interface BillingStatementsPageProps {
  initialData: any[]
  analytics: any
}

export function BillingStatementsPage({ initialData, analytics }: BillingStatementsPageProps) {
  return (
    <div className="space-y-6">
      <Suspense fallback={<BillingStatementsTableSkeleton />}>
        <BillingStatementsClient initialData={initialData} analytics={analytics} />
      </Suspense>
    </div>
  )
}