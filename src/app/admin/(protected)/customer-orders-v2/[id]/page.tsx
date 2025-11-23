import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageBody,
  PageHeaderActions,
} from "@/components/shared/page-layout";
import { getCustomerOrderById } from "@/lib/actions/customer-order";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { OverviewSection } from "@/components/module/admin/customer-order-ver/view/OverviewSection";
// import { FulfillmentSection } from "@/components/module/admin/customer-order-ver/view/FulfillmentSection";
import { ProductionSection } from "@/components/module/admin/customer-order-ver/view/ProductionSection";
import { BillingSection } from "@/components/module/admin/customer-order-ver/view/BillingSection";
import { PaymentSection } from "@/components/module/admin/customer-order-ver/view/PaymentSection";
import { Prisma } from "@prisma/client";

interface PageProps {
  params: Promise<{ id: string }>;
}

function OrderDetails({ order }: { order: any }) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-muted p-1 rounded-lg">
            <TabsTrigger value="overview" className="text-sm font-medium">Overview</TabsTrigger>
            {/* <TabsTrigger value="fulfillment" className="text-sm font-medium">Fulfillment</TabsTrigger> */}
            <TabsTrigger value="production" className="text-sm font-medium">Production</TabsTrigger>
            <TabsTrigger value="billing" className="text-sm font-medium">Billing</TabsTrigger>
            <TabsTrigger value="payment" className="text-sm font-medium">Payment</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <OverviewSection order={order} />
        </TabsContent>

        {/* <TabsContent value="fulfillment">
          <FulfillmentSection order={order} />
        </TabsContent> */}

        <TabsContent value="production">
          <ProductionSection order={order} />
        </TabsContent>

        <TabsContent value="billing">
          <BillingSection order={order} />
        </TabsContent>

        <TabsContent value="payment">
          <PaymentSection order={order} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default async function CustomerOrderV2DetailPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch order data to display order number in title
  const dbOrder: any = await getCustomerOrderById(id);

  // Recursively convert Prisma Decimal, Date, BigInt, and other non-plain values to JSON-safe primitives
  const serializeForClient = (value: any): any => {
    if (value === null || value === undefined) return value;
    const t = typeof value;
    if (t === "string" || t === "number" || t === "boolean") return value;
    if (typeof BigInt !== "undefined" && t === "bigint") return value.toString();
    if (value instanceof Date) return value.toISOString();
    // Handle Prisma Decimal (robust across module boundaries)
    const isPrismaDecimal = (() => {
      try {
        if (value?.constructor?.name === "Decimal") return true;
        const D = (Prisma as any)?.Decimal;
        if (D?.isDecimal && D.isDecimal(value)) return true;
        if (D && value instanceof D) return true;
      } catch {}
      return false;
    })();
    if (isPrismaDecimal) {
      const s = value.toString();
      const num = Number(s);
      return Number.isFinite(num) ? num : s;
    }
    if (Array.isArray(value)) return value.map(serializeForClient);
    if (t === "object") {
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        out[k] = serializeForClient(v);
      }
      return out;
    }
    // Functions, symbols, etc. are omitted
    return undefined;
  };

  const order: any = serializeForClient(dbOrder);

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderMain>
          <div className="flex items-center gap-3">
            <Link href="/admin/customer-orders-v2">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <PageTitle>
                {order.orderNumber ? `Order ${order.orderNumber}` : "Customer Order Details"}
              </PageTitle>
              <PageDescription>
                View complete order information and track fulfillment progress
              </PageDescription>
            </div>
          </div>
        </PageHeaderMain>
        <PageHeaderActions>
          <Link href={`/admin/customer-orders-v2/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Order
            </Button>
          </Link>
        </PageHeaderActions>
      </PageHeader>

      <PageBody>
        <OrderDetails order={order} />
      </PageBody>
    </PageContainer>
  );
}