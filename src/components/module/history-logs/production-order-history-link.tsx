"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { History, ExternalLink } from "lucide-react"

interface ProductionOrderHistoryLinkProps {
  productionOrderId: string
  variant?: "button" | "badge" | "link"
  className?: string
  showIcon?: boolean
  onClick?: () => void // New prop to handle click for modal
}

export default function ProductionOrderHistoryLink({
  productionOrderId,
  variant = "button",
  className = "",
  showIcon = true,
  onClick,
}: ProductionOrderHistoryLinkProps) {
  const href = `/admin/production/${productionOrderId}` // Keep href for potential direct link, but use onClick for modal

  const content = (
    <>
      {showIcon && <History className="h-3 w-3 mr-1" />}
      View History
    </>
  )

  if (variant === "badge") {
    return (
      <Badge variant="outline" className={`cursor-pointer hover:bg-accent ${className}`} onClick={onClick}>
        {content}
      </Badge>
    )
  }

  if (variant === "link") {
    return (
      <a
        onClick={onClick}
        className={`text-primary hover:text-primary/80 underline-offset-4 hover:underline inline-flex items-center gap-1 cursor-pointer ${className}`}
      >
        {showIcon && <History className="h-4 w-4" />}
        View Production History
        <ExternalLink className="h-3 w-3" />
      </a>
    )
  }

  return (
    <Button variant="outline" size="sm" className={className} onClick={onClick}>
      {showIcon && <History className="h-4 w-4 mr-2" />}
      View History
    </Button>
  )
}
