import { Suspense } from "react";
import { getProductionOrder } from "@/lib/actions/production-order";
import { ProductionMaterialsManagement } from "@/components/module/admin/production/production-materials-management";
import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";

interface ProductionMaterialsPageProps {
  params: {
    id: string;
  };
}

export default async function ProductionMaterialsPage({
  params,
}: ProductionMaterialsPageProps) {
  try {
    const order = await getProductionOrder(params.id);
    
    if (!order) {
      notFound();
    }

    return (
      <div className="container mx-auto p-6">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          }
        >
          <ProductionMaterialsManagement order={order} />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error("Error loading production materials page:", error);
    notFound();
  }
} 