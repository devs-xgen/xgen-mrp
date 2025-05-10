import { Metadata } from "next";
import { MaterialRequestForm } from "@/components/module/worker/inventory";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Request Materials",
  description: "Request materials for your work center",
};

export default function RequestMaterialsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Request Materials
          </h2>
          <p className="text-muted-foreground">
            Request materials for your work center
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/worker/inventory">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inventory
          </Link>
        </Button>
      </div>

      <MaterialRequestForm />
    </div>
  );
}
