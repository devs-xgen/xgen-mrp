"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface ExportTriggerProps {
  csvContent: string;
  filename: string;
}

export function ExportTrigger({ csvContent, filename }: ExportTriggerProps) {
  const router = useRouter();

  useEffect(() => {
    // Create a data URL for the CSV content
    const csvData = `data:text/csv;charset=utf-8,${encodeURIComponent(
      csvContent
    )}`;

    // Create a download link and trigger the download
    const downloadLink = document.createElement("a");
    downloadLink.href = csvData;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Redirect back to the inventory page
    router.push("/worker/inventory?export_success=true");
  }, [csvContent, filename, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Exporting Inventory Data</h1>
      <p className="text-muted-foreground">
        Your download should start automatically...
      </p>
      <p className="mt-4">
        <a href="/worker/inventory" className="text-primary hover:underline">
          Click here if you are not redirected automatically
        </a>
      </p>
    </div>
  );
}
