// Server component page
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

import { Button } from "@/components/ui/button";

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

// Import client component that handles interactive form logic
import { SuperAdminCreateDeliveryReceiptClient } from "./client";

export const metadata: Metadata = {
  title: "Create Delivery Receipt",
  description: "Create a new delivery receipt linked to a billing statement",
};

export default function SuperAdminCreateDeliveryReceiptPage() {
  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Create Delivery Receipt</PageTitle>
          <PageDescription>
            Create a new delivery receipt linked to a billing statement
          </PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <Button asChild variant="outline">
            <Link href="/superadmin/billing/delivery-receipts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Delivery Receipts
            </Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      {/* Page Body */}
      <PageBody>
        <SuperAdminCreateDeliveryReceiptClient />
      </PageBody>
    </PageContainer>
  );
}
