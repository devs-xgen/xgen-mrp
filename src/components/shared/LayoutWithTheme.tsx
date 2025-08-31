"use client";

import AppSidebar from "@/components/shared/AppSidebar";

export default function LayoutWithTheme({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Fixed Sidebar (left) */}
      <div className="sticky top-0 h-[100dvh] flex-shrink-0">
        <AppSidebar />
      </div>

      {/* Main Content (right) */}
      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}