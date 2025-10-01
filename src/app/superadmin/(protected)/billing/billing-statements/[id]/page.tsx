import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/shared/page-layout";

// Import types and server actions
import { 
  BillingStatementWithRelations,
} from "@/types/admin/billing";
import { 
  getBillingStatementById,
} from "@/lib/actions/superadmin/billing-statements";
import { 
  getBillingStatementId, 
  isParamsResolutionError,
  type BillingRouteParams 
} from "@/lib/utils/params-handler";
import { SerializableData, serializeDecimals } from "@/lib/utils/decimal-serializer";

// Client component for interactive functionality
import { SuperAdminBillingStatementClient } from "./client";

interface BillingStatementPageProps {
  params: BillingRouteParams;
  searchParams?: Record<string, string | string[]>;
}

export default async function SuperAdminBillingStatementPage({ params, searchParams }: BillingStatementPageProps) {
  let billingStatementId: string;
  
  try {
    billingStatementId = getBillingStatementId(params);
  } catch (error) {
    console.error('Error resolving params:', error);
    
    if (isParamsResolutionError(error)) {
      // Handle params resolution errors gracefully
      return (
        <PageContainer>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Invalid URL</h2>
              <p className="text-muted-foreground mb-4">
                The billing statement URL is invalid or malformed.
              </p>
              <Button asChild>
                <Link href="/superadmin/billing/billing-statements">
                  Back to Billing Statements
                </Link>
              </Button>
            </div>
          </div>
        </PageContainer>
      );
    }
    
    // For other errors, show generic error
    throw error;
  }

  // Fetch billing statement data
  let billingStatement: SerializableData<BillingStatementWithRelations> | null = null;
  // Resolve initial edit mode from query
  const sp = searchParams || {};
  const editParam = (typeof sp.edit === 'string' ? sp.edit : Array.isArray(sp.edit) ? sp.edit[0] : undefined);
  const initialIsEditing = editParam === '1' || editParam === 'true';
  
  try {
    const result = await getBillingStatementById(billingStatementId);
    // Extra safety: ensure deep serialization before passing to client
    billingStatement = result ? (serializeDecimals(result) as SerializableData<BillingStatementWithRelations>) : null;
  } catch (error) {
    console.error('Error loading billing statement:', error);
    // Let the component handle the null case
  }

  // If billing statement not found, show not found page
  if (!billingStatement) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Billing Statement Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The billing statement you&apos;re looking for doesn&apos;t exist or has been deleted.
            </p>
            <Button asChild>
              <Link href="/superadmin/billing/billing-statements">
                Back to Billing Statements
              </Link>
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Suspense fallback={<BillingStatementPageSkeleton />}>
        <SuperAdminBillingStatementClient 
          billingStatement={billingStatement} 
          billingStatementId={billingStatementId}
          initialIsEditing={initialIsEditing}
        />
      </Suspense>
    </PageContainer>
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
