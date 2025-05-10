"use client";

import { useEffect } from "react";

interface RequestPdfTriggerProps {
  htmlContent: string;
  filename: string;
  onDownloadComplete?: () => void;
}

export default function RequestPdfTrigger({
  htmlContent,
  filename,
  onDownloadComplete,
}: RequestPdfTriggerProps) {
  useEffect(() => {
    // Create a Blob from the HTML content
    const blob = new Blob([htmlContent], { type: "text/html" });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a link element
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;

    // Append to the document, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Revoke the URL to free up memory
    URL.revokeObjectURL(url);

    // Call the completion callback if provided
    if (onDownloadComplete) {
      onDownloadComplete();
    }
  }, [htmlContent, filename, onDownloadComplete]);

  // This component doesn't render anything visible
  return null;
}
