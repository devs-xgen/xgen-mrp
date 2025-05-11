import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import "@/styles/date-picker.css";
import { Toaster } from "@/components/ui/toaster";
import AuthProvider from "@/components/providers/auth-provider";
import { FullscreenProvider } from "@/components/ui/fullscreen-context";
import { GlobalFullscreenToggle } from "@/components/ui/global-fullscreen-toggle";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inventory Management System",
  description: "A comprehensive inventory management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <FullscreenProvider>
            <div className="relative">
              {children}
              <div className="fixed bottom-4 right-4 z-50">
                <GlobalFullscreenToggle />
              </div>
              <Toaster />
            </div>
          </FullscreenProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
