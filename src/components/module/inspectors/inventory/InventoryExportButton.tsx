"use client";

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import Link from "next/link";

export function InventoryExportButton() {
  return (
    <Button asChild variant="outline" size="sm">
      <Link href="/inspector/inventory/export">
        <FileDown className="mr-2 h-4 w-4" />
        Export
      </Link>
    </Button>
  );
}
