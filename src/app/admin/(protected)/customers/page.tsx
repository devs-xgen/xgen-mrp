import { Metadata } from "next";
import { getAllCustomers } from "@/lib/actions/customers";
import { convertDecimals } from "@/lib/convertDecimals";
import { CustomersPageClient } from "@/components/module/admin/customers/customers-page-client";

export const metadata: Metadata = {
  title: "Customers",
  description: "Manage your customers and their information",
};

export default async function CustomersPage() {
  const customersRaw = await getAllCustomers();
  
  // Convert Decimal fields to numbers for client component compatibility
  const customers = convertDecimals(customersRaw);

  return <CustomersPageClient initialCustomers={customers} />;
}
