import { Skeleton } from "@/components/ui/skeleton"

interface DataTableLoadingProps {
    columnCount: number
    rowCount?: number
}

export function DataTableLoading({
    columnCount,
    rowCount = 10,
}: DataTableLoadingProps) {
    return (
        <div className="w-full space-y-3 overflow-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-[250px]" />
                    <Skeleton className="h-8 w-[90px]" />
                </div>
                <Skeleton className="h-8 w-[70px]" />
            </div>
            <div className="rounded-md border">
                <div className="border-b">
                    <div className="grid h-12 items-center gap-3 px-4">
                        {Array(columnCount)
                            .fill(null)
                            .map((_, i) => (
                                <Skeleton key={i} className="h-6 w-full" />
                            ))}
                    </div>
                </div>
                <div>
                    {Array(rowCount)
                        .fill(null)
                        .map((_, i) => (
                            <div
                                key={i}
                                className="grid h-16 items-center gap-3 px-4 border-b last:border-0"
                            >
                                {Array(columnCount)
                                    .fill(null)
                                    .map((_, i) => (
                                        <Skeleton key={i} className="h-6 w-full" />
                                    ))}
                            </div>
                        ))}
                </div>
            </div>
        </div>
    )
} 