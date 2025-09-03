import { Suspense } from "react";
import { 
  PageContainer, 
  PageHeader, 
  PageHeaderMain, 
  PageTitle, 
  PageDescription, 
  PageBody,
  SectionCard 
} from "@/components/shared/page-layout";
import { getArchivedOrders } from "@/lib/actions/order-archiving";
import { CustomerOrderArchiveClient } from "@/components/module/admin/customer-order-ver/CustomerOrderArchiveClient";

async function ArchiveData() {
  // Fetch archived orders
  const { archives, total, pageCount } = await getArchivedOrders();

  return (
    <CustomerOrderArchiveClient 
      initialArchives={archives}
      total={total}
      pageCount={pageCount}
    />
  );
}

export default function CustomerOrdersV2ArchivesPage() {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Archived Customer Orders</PageTitle>
          <PageDescription>
            View and manage customer orders that have been archived. 
            Archived orders are removed from active operations but preserved for record keeping.
          </PageDescription>
        </PageHeaderMain>
      </PageHeader>
      
      <PageBody>
        <Suspense fallback={
          <SectionCard heading="Loading archived orders...">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </SectionCard>
        }>
          <ArchiveData />
        </Suspense>
      </PageBody>
    </PageContainer>
  );
}
