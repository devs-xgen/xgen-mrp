import { Metadata } from "next"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Billing Statements",
  description: "Manage customer billing statements",
}

export default function SimpleBillingStatementsRedirectPage() {
  // Deprecated route: redirect to consolidated billing reports
  redirect("/admin/billing/billing-reports")
}