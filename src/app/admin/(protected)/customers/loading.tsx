// src/app/admin/(protected)/dashboard/loading.tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col gap-5 p-8">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px] mt-2" />
        </div>
        <Skeleton className="h-10 w-[150px]" />
      </div>
      <div className="border rounded-lg">
        <Skeleton className="h-[500px] w-full" />
      </div>
    </div>
  )
}