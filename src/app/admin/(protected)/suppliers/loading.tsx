// src/app/admin/(protected)/dashboard/loading.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { PageSkeleton } from "@/components/shared/page-skeleton"

export default function Loading() {
    return <PageSkeleton />
  }