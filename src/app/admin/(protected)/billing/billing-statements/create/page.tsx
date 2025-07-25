import { Metadata } from "next";
import CreateBillingStatementClient from "./client";

// Page metadata for SEO
export const metadata: Metadata = {
  title: "Create Billing Statement | Admin Dashboard",
  description: "Create a new billing statement for customers or customer orders with enhanced form validation and step-by-step guidance.",
  keywords: ["billing", "statement", "invoice", "customer", "admin"],
};

export default function CreateBillingStatementPage() {
  return <CreateBillingStatementClient />;
}

