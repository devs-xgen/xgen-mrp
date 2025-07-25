import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

// Import types and server actions
import { 
  BillingStatementWithRelations,
} from "@/types/admin/billing";
import { 
  getBillingStatementById,
} from "@/lib/actions/billing-statements";
import { 
  getBillingStatementId, 
  ParamsResolutionError,
  isParamsResolutionError,
  type BillingRouteParams 
} from "@/lib/utils/params-handler";

// Client component for interactive functionality
import { BillingStatementClient } from "./client";

interface BillingStatementPageProps {
  params: Promise<BillingRouteParams>;
}

export default async function BillingStatementPage({ params }: BillingStatementPageProps) {
  let billingStatementId: string;
  
  try {
    const resolvedParams = await params;
    billingStatementId = getBillingStatementId(resolvedParams);
  } catch (error) {
    console.error('Error resolving params:', error);
    
    if (isParamsResolutionError(error)) {
      // Handle params resolution errors gracefully
      return (
        <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Invalid URL</h2>
              <p className="text-muted-foreground mb-4">
                The billing statement URL is invalid or malformed.
              </p>
              <Button asChild>
                <Link href="/admin/billing/billing-statements">
                  Back to Billing Statements
                </Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    // For other errors, show generic error
    throw error;
  }

  // Fetch billing statement data
  let billingStatement: BillingStatementWithRelations | null = null;
  
  try {
    const result = await getBillingStatementById(billingStatementId);
    billingStatement = result;
  } catch (error) {
    console.error('Error loading billing statement:', error);
    // Let the component handle the null case
  }

  // If billing statement not found, show not found page
  if (!billingStatement) {
    return (
      <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Billing Statement Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The billing statement you&apos;re looking for doesn&apos;t exist or has been deleted.
            </p>
            <Button asChild>
              <Link href="/admin/billing/billing-statements">
                Back to Billing Statements
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<BillingStatementPageSkeleton />}>
      <BillingStatementClient 
        billingStatement={billingStatement} 
        billingStatementId={billingStatementId}
      />
    </Suspense>
  );
}

// Loading skeleton component
function BillingStatementPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    </div>
  );
}