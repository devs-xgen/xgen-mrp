// src/app/inspector/(protected)/inventory/page.tsx
import { Metadata } from "next";
import { InventoryPage } from "@/components/module/operator/inventory";

export const metadata: Metadata = {
  title: "Inventory Management",
  description: "Check inventory levels and manage stock",
};

export default function Page({
  searchParams,
}: {
  searchParams?: { 
    search?: string;
    materialType?: string;
    stockLevel?: string;
    locationType?: string;
    page?: string;
    sort?: string;
    direction?: string;
    export_success?: string;
    export_error?: string;
  };
}) {
  return <InventoryPage searchParams={searchParams} />;
}
