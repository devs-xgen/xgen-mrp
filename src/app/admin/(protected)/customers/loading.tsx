// src/app/admin/(protected)/dashboard/loading.tsx
import { Skeleton } from "@/components/ui/skeleton"
import { DataTableLoading } from "@/components/ui/data-table-loading"

export default function Loading() {
  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-8 w-[100px]" />
      </div>
      <DataTableLoading columnCount={7} rowCount={5} />
    </div>
  )
}