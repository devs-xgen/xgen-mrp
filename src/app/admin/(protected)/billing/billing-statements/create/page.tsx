import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BillingStatementCreateClient } from "@/components/module/admin/billing/billing-statement-create-client";

// Import page layout components
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  PageBody,
} from "@/components/shared/page-layout";

export const metadata: Metadata = {
  title: "Create Billing Statement",
  description: "Create a new billing statement for customers",
};

function CreateBillingStatementSkeleton() {
  return (
    <div className="space-y-6">
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
    <PageContainer>
      {/* Page Header */}
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Create Billing Statement</PageTitle>
          <PageDescription>
            Create a new billing statement by selecting a customer source and filling in the required details
          </PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <Link href="/admin/billing/billing-statements">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Billing Statements
            </Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      {/* Page Body */}
      <PageBody>
        <Suspense fallback={<CreateBillingStatementSkeleton />}>
          <BillingStatementCreateClient />
        </Suspense>
      </PageBody>
    </PageContainer>
  );
}