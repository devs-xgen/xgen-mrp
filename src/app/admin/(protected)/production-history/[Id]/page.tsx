"use client" // This page needs to be a client component to use useState for the modal

import { notFound } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { getProductionOrderWithLogs } from "@/lib/actions/history-log/enhanced-production-operations"
import ProductionOrderDetailsClient from "@/components/module/history-logs/production-order-details-client"
import { useEffect, useState } from "react" // Import useEffect and useState for client-side data fetching

interface ProductionOrderDetailPageProps {
  params: {
    id: string
  }
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {" "}
        {/* Adjusted to 3 columns for general info */}
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ProductionOrderDetailPage({ params }: ProductionOrderDetailPageProps) {
  const [productionOrder, setProductionOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        const data = await getProductionOrderWithLogs(params.id)
        if (!data) {
          notFound() // Use Next.js notFound for 404
        }
        setProductionOrder(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load production order details.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [params.id])

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return <div className="text-center text-red-500 p-6">Error: {error}</div>
  }

  if (!productionOrder) {
    return notFound() // Should ideally be caught by loading/error, but as a fallback
  }

  return (
    <div className="min-h-screen bg-background">
      <ProductionOrderDetailsClient productionOrder={productionOrder} />
    </div>
  )
}
