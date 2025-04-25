"use client";

import { useEffect } from "react";

interface RequestPdfTriggerProps {
  pdfContent: string;
  filename: string;
}

export function RequestPdfTrigger({
  pdfContent,
  filename,
}: RequestPdfTriggerProps) {
  useEffect(() => {
    // Create a Blob with the HTML content
    const htmlBlob = new Blob([pdfContent], { type: "text/html" });

    // Create an object URL
    const dataUrl = URL.createObjectURL(htmlBlob);

    // Create a download link and trigger the download
    const downloadLink = document.createElement("a");
    downloadLink.href = dataUrl;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Clean up the URL object
    URL.revokeObjectURL(dataUrl);
  }, [pdfContent, filename]);

  return null;
}
