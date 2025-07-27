import { Suspense } from "react";
import { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { BillingStatementCreateClient } from "@/components/module/admin/billing/billing-statement-create-client";

export const metadata: Metadata = {
  title: "Create Billing Statement",
  description: "Create a new billing statement for customers",
};

function CreateBillingStatementSkeleton() {
  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[300px]" />
        <Skeleton className="h-4 w-[500px]" />
      </div>
      <div className="grid gap-6">
        <Skeleton className="h-[400px] w-full" />
      </div>
    </div>
  );
}

export default async function CreateBillingStatementPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="space-y-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create Billing Statement</h1>
        <p className="text-muted-foreground">
          Create a new billing statement by selecting a customer source and filling in the required details
        </p>
      </div>

      <Suspense fallback={<CreateBillingStatementSkeleton />}>
        <BillingStatementCreateClient />
      </Suspense>
    </div>
  );
}