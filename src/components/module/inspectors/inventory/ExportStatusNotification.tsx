"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

export function ExportStatusNotification() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const exportSuccess = searchParams.get("export_success");
    const exportError = searchParams.get("export_error");

    if (exportSuccess === "true") {
      toast({
        title: "Export successful",
        description: "Inventory data has been exported successfully",
      });

      // Remove the query parameter
      const params = new URLSearchParams(searchParams.toString());
      params.delete("export_success");
      router.replace(`?${params.toString()}`);
    }

    if (exportError === "true") {
      toast({
        title: "Export failed",
        description: "Failed to export inventory data",
        variant: "destructive",
      });

      // Remove the query parameter
      const params = new URLSearchParams(searchParams.toString());
      params.delete("export_error");
      router.replace(`?${params.toString()}`);
    }
  }, [searchParams, router]);

  return null;
}
