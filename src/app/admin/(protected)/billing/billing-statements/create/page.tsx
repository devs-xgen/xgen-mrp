import { Metadata } from "next";
import CreateBillingStatementClient from "./client";

// Enhanced page metadata for SEO and accessibility
export const metadata: Metadata = {
  title: "Create Billing Statement | MRP Admin Dashboard",
  description: "Create professional billing statements with our enhanced form system. Features step-by-step guidance, real-time validation, auto-save functionality, and support for customer orders, direct customer billing, and manual entry.",
  keywords: [
    "billing statement",
    "invoice creation", 
    "customer billing",
    "order billing",
    "MRP system",
    "admin dashboard",
    "financial management",
    "business invoicing",
    "automated billing",
    "form validation"
  ],
  authors: [{ name: "MRP System" }],
  creator: "MRP Admin System",
  publisher: "MRP System",
  robots: {
    index: false, // Admin pages should not be indexed
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  openGraph: {
    title: "Create Billing Statement | MRP Admin",
    description: "Professional billing statement creation with enhanced form validation and step-by-step guidance",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Create Billing Statement | MRP Admin",
    description: "Professional billing statement creation with enhanced form validation",
  },
  other: {
    "application-name": "MRP Admin Dashboard",
    "msapplication-TileColor": "#2563eb",
    "theme-color": "#2563eb",
  },
};

export default function CreateBillingStatementPage() {
  return <CreateBillingStatementClient />;
}

