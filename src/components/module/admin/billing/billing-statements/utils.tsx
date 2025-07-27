import { Badge } from "@/components/ui/badge"
import { BillingStatus } from "@/types/admin/billing"

export const getStatusBadge = (status: BillingStatus) => {
  switch (status) {
    case "DRAFT":
      return <Badge variant="secondary">Draft</Badge>
    case "SENT":
      return <Badge variant="outline" className="bg-blue-500 text-white">Sent</Badge>
    case "PAID":
      return <Badge variant="default" className="bg-green-500 text-white">Paid</Badge>
    case "OVERDUE":
      return <Badge variant="destructive">Overdue</Badge>
    case "CANCELLED":
      return <Badge variant="destructive">Cancelled</Badge>
    case "DISPUTED":
      return <Badge variant="secondary" className="bg-orange-500 text-white">Disputed</Badge>
    case "PARTIAL":
      return <Badge variant="outline" className="bg-yellow-500 text-white">Partial</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export const getStatusOptions = () => [
  { label: "Draft", value: "DRAFT" },
  { label: "Sent", value: "SENT" },
  { label: "Paid", value: "PAID" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Disputed", value: "DISPUTED" },
  { label: "Partial", value: "PARTIAL" },
]