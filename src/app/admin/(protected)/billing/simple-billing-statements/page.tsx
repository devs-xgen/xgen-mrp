import { Metadata } from "next"
import { getBillingStatements } from "@/lib/actions/simple-billing-statements"
import { SimpleBillingStatementsTable } from "@/components/module/admin/billing/simple-billing-statements-table"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Billing Statements",
  description: "Manage customer billing statements",
}

export default async function BillingStatementsPage() {
  const billingStatements = await getBillingStatements()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing Statements</h1>
        <p className="text-muted-foreground">
          Manage and track customer billing statements
        </p>
      </div>

      <SimpleBillingStatementsTable data={billingStatements} />
    </div>
  )
}