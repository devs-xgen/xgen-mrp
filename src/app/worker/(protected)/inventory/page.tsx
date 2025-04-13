// src/app/worker/(protected)/inventory/page.tsx
import { Metadata } from "next";
import { InventoryPage } from "@/components/module/operator/inventory";

export const metadata: Metadata = {
  title: "Inventory Management",
  description: "Check inventory levels and manage stock",
};

export default function Page({
  searchParams,
}: {
  searchParams?: { search?: string };
}) {
  return <InventoryPage searchParams={searchParams} />;
}
