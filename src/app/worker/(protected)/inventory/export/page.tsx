import { exportInventoryData } from "@/lib/actions/worker/inventory";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { ExportTrigger } from "@/components/module/worker/inventory/ExportTrigger";

export const metadata: Metadata = {
  title: "Exporting Inventory Data",
  description: "Exporting inventory data as CSV",
};

export default async function ExportInventoryPage() {
  try {
    // Get the CSV data
    const { csvContent, filename } = await exportInventoryData();

    // The CSV download will be handled on the client side
    // through the ExportTrigger component
    return (
      <div>
        <ExportTrigger csvContent={csvContent} filename={filename} />
      </div>
    );
  } catch (error) {
    console.error("Error exporting inventory data:", error);
    redirect("/worker/inventory?export_error=true");
  }
}
