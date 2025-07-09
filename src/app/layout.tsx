import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import "@/styles/date-picker.css";
import { Toaster } from "@/components/ui/toaster";
import AuthProvider from "@/components/providers/auth-provider";
import { FullscreenProvider } from "@/components/ui/fullscreen-context";
import { GlobalFullscreenToggle } from "@/components/ui/global-fullscreen-toggle";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "XGen MRP - Inventory Management System",
    template: "%s | XGen MRP"
  },
  description: "A comprehensive inventory management system with role-based access control",
  keywords: ["inventory", "management", "MRP", "production", "quality control"],
  authors: [{ name: "XGen Team" }],
  creator: "XGen",
  publisher: "XGen",
  robots: {
    index: false, // Don't index in production for security
    follow: false,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' }
  ],
};

// Error Boundary Component
function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}

// Security and Performance wrapper
function SecurityWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Security Headers */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
      
      {/* Performance Hints */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="" />
      
      {children}
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <SecurityWrapper>
          {/* Critical CSS preload */}
          <link
            rel="preload"
            href="/fonts/GeistVF.woff"
            as="font"
            type="font/woff"
            crossOrigin=""
          />
          <link
            rel="preload"
            href="/fonts/GeistMonoVF.woff"
            as="font"
            type="font/woff"
            crossOrigin=""
          />
        </SecurityWrapper>
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <GlobalErrorBoundary>
          <AuthProvider>
            <FullscreenProvider>
              <div className="relative min-h-screen bg-background">
                {/* Main content area */}
                <main className="relative">
                  {children}
                </main>
                
                {/* Fixed UI elements */}
                <div className="fixed bottom-4 right-4 z-50">
                  <GlobalFullscreenToggle />
                </div>
                
                {/* Toast notifications */}
                <Toaster />
              </div>
            </FullscreenProvider>
          </AuthProvider>
        </GlobalErrorBoundary>
        
        {/* Performance monitoring script for development */}
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Simple performance monitoring
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData) {
                      console.info('📊 Page Performance:', {
                        loadTime: Math.round(perfData.loadEventEnd - perfData.fetchStart) + 'ms',
                        domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart) + 'ms',
                        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 'N/A'
                      });
                    }
                  }, 0);
                });
                
                // Session storage cleanup on unload
                window.addEventListener('beforeunload', function() {
                  // Clean up sensitive data from session storage
                  const keysToKeep = ['next-auth.session-token', '__Secure-next-auth.session-token'];
                  Object.keys(sessionStorage).forEach(key => {
                    if (!keysToKeep.includes(key)) {
                      sessionStorage.removeItem(key);
                    }
                  });
                });
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}
