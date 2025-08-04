import { Metadata } from "next";
import { InstallGuideClient } from "./client";

export const metadata: Metadata = {
  title: "Install XGEN MRP App | Download & Installation Guide",
  description: "Learn how to install XGEN MRP as a mobile app on your device. Step-by-step guide for iOS, Android, and Desktop installation.",
  keywords: ["XGEN MRP", "install app", "PWA", "mobile app", "download", "installation guide"],
};

export default function InstallAppPage() {
  return <InstallGuideClient />;
}