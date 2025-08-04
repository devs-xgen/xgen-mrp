"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Download, 
  Smartphone, 
  Monitor, 
  Tablet,
  Share,
  Plus,
  MoreHorizontal,
  Chrome,
  Globe,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { IconGeneratorSection } from "./icon-generator";
import { PWAStatusChecker } from "./pwa-status";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallGuideClient() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [userAgent, setUserAgent] = useState<string>("");
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop" | "unknown">("unknown");

  useEffect(() => {
    setUserAgent(navigator.userAgent);
    
    // Detect platform with tablet/desktop focus
    const isIPad = /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isIPhone = /iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroidTablet = /Android/.test(navigator.userAgent) && !navigator.userAgent.toLowerCase().includes('mobile');
    const isAndroidPhone = /Android/.test(navigator.userAgent) && navigator.userAgent.toLowerCase().includes('mobile');
    const isDesktop = !isIPad && !isIPhone && !isAndroidTablet && !isAndroidPhone;
    
    // Determine platform priority: tablets and desktop only
    if (isIPad) setPlatform("ios");
    else if (isAndroidTablet) setPlatform("android");
    else if (isDesktop) setPlatform("desktop");
    else setPlatform("unknown"); // Phones are not supported

    // Debug PWA capabilities
    console.log('🔍 PWA Debug Info:');
    console.log('📱 User Agent:', navigator.userAgent);
    console.log('📱 iPad detected:', isIPad);
    console.log('📱 iPhone detected:', isIPhone);
    console.log('📱 Android Tablet detected:', isAndroidTablet);
    console.log('📱 Android Phone detected:', isAndroidPhone);
    console.log('🖥️ Platform:', platform);
    console.log('🔒 Protocol:', window.location.protocol);
    console.log('🏠 Origin:', window.location.origin);
    console.log('📋 Standalone mode:', window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    
    // Check screen size for tablet/desktop optimization
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const minDimension = Math.min(screenWidth, screenHeight);
    const maxDimension = Math.max(screenWidth, screenHeight);
    console.log('📐 Screen size:', `${screenWidth}x${screenHeight}`);
    console.log('📐 Suitable for app:', minDimension >= 768); // Tablet minimum
    
    // Check service worker
    if ('serviceWorker' in navigator) {
      console.log('✅ Service Worker supported');
      navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log('📝 Service Worker registrations:', registrations.length);
        registrations.forEach((registration, index) => {
          console.log(`📝 SW ${index + 1}:`, registration.scope, registration.active?.state);
        });
      });
    } else {
      console.log('❌ Service Worker not supported');
    }

    // Check manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      console.log('✅ Manifest link found:', manifestLink.getAttribute('href'));
      
      // Try to fetch and validate manifest
      fetch('/manifest.json')
        .then(response => response.json())
        .then(manifest => {
          console.log('📋 Manifest loaded:', manifest);
          console.log('📋 Manifest icons:', manifest.icons?.length || 0);
        })
        .catch(error => {
          console.error('❌ Manifest fetch error:', error);
        });
    } else {
      console.log('❌ Manifest link not found');
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('🎉 beforeinstallprompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      toast.success('PWA install prompt is now available!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      console.log('✅ App is already installed and running in standalone mode');
    }

    // Additional PWA event listeners for debugging
    window.addEventListener('appinstalled', () => {
      console.log('🎉 App was installed successfully!');
      toast.success('App installed successfully!');
    });

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service worker controller changed');
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    setIsInstalling(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast.success('App installed successfully!');
        setDeferredPrompt(null);
        setIsInstallable(false);
      } else {
        toast.info('Installation cancelled');
      }
    } catch (error) {
      console.error('Installation failed:', error);
      toast.error('Installation failed. Please try again.');
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          
                      <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <Download className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Install XGEN MRP</h1>
            <p className="text-xl text-gray-600 mb-6">
              Professional manufacturing app optimized for tablets and desktop
            </p>
            
            {/* Device Compatibility Warning */}
            {(platform === "unknown" || (typeof window !== 'undefined' && Math.min(window.screen.width, window.screen.height) < 768)) && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-orange-800">
                  <AlertCircle className="h-5 w-5" />
                  <strong>Device Notice</strong>
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  XGEN MRP is optimized for tablets (iPad, Android tablets) and desktop computers. 
                  For the best experience, please use a device with a larger screen.
                </p>
              </div>
            )}
            
            {/* Install Button - Show if installable */}
            {isInstallable && (
              <Button 
                onClick={handleInstallClick}
                disabled={isInstalling}
                size="lg"
                className="mb-6"
              >
                {isInstalling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Install App Now
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Platform Detection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Detected Platform
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {platform === "ios" && <Tablet className="h-8 w-8 text-blue-600" />}
              {platform === "android" && <Tablet className="h-8 w-8 text-green-600" />}
              {platform === "desktop" && <Monitor className="h-8 w-8 text-gray-600" />}
              {platform === "unknown" && <Smartphone className="h-8 w-8 text-orange-500" />}
              
              <div>
                <p className="font-medium capitalize">
                  {platform === "ios" && "iPad"}
                  {platform === "android" && "Android Tablet"}
                  {platform === "desktop" && "Desktop/Laptop"}
                  {platform === "unknown" && "Unsupported Device"}
                </p>
                <p className="text-sm text-gray-500">
                  {platform === "ios" && "iPad detected - Optimal experience"}
                  {platform === "android" && "Android tablet detected - Optimal experience"}
                  {platform === "desktop" && "Desktop/Laptop detected - Optimal experience"}
                  {platform === "unknown" && "Phone detected - Please use a tablet or desktop"}
                </p>
              </div>
              
              <Badge variant={platform === "unknown" ? "destructive" : "outline"} className="ml-auto">
                {platform === "unknown" ? "Not Supported" : (isInstallable ? "Installable" : "Manual Installation")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* PWA Status Checker */}
        <PWAStatusChecker />

        {/* Installation Instructions */}
        <div className="grid gap-6">
          {/* iPad Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tablet className="h-5 w-5 text-blue-600" />
                iPad Installation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <Globe className="inline h-4 w-4 mr-1" />
                  <strong>Important:</strong> Use Safari browser for installation
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <p className="font-medium">Open XGEN MRP in Safari on your iPad</p>
                    <p className="text-sm text-gray-600">Use Safari browser for best iPad experience</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <p className="font-medium">Tap the Share button</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      Look for the <Share className="h-4 w-4" /> icon at the bottom of the screen
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <p className="font-medium">Select "Add to Home Screen"</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      Scroll down and tap <Plus className="h-4 w-4" /> "Add to Home Screen"
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <p className="font-medium">Confirm installation</p>
                    <p className="text-sm text-gray-600">Tap "Add" to install XGEN MRP to your home screen</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Android Tablet Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tablet className="h-5 w-5 text-green-600" />
                Android Tablet Installation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800 mb-2">
                  <Chrome className="inline h-4 w-4 mr-1" />
                  <strong>Recommended:</strong> Use Chrome browser for best experience
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <p className="font-medium">Open XGEN MRP in Chrome on your tablet</p>
                    <p className="text-sm text-gray-600">Use Chrome browser on Android tablet for best experience</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <p className="font-medium">Look for the install banner</p>
                    <p className="text-sm text-gray-600">Chrome will show an "Install" banner at the bottom</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <p className="font-medium">Or use the menu option</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      Tap <MoreHorizontal className="h-4 w-4" /> menu → "Install app" or "Add to Home screen"
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <p className="font-medium">Confirm installation</p>
                    <p className="text-sm text-gray-600">Tap "Install" to add XGEN MRP to your home screen</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Desktop Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-gray-600" />
                Desktop Installation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-800 mb-2">
                  <Chrome className="inline h-4 w-4 mr-1" />
                  <strong>Works with:</strong> Chrome, Edge, and other Chromium-based browsers
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <p className="font-medium">Look for the install icon</p>
                    <p className="text-sm text-gray-600">Check the address bar for a download/install icon</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <p className="font-medium">Click the install button</p>
                    <p className="text-sm text-gray-600">Or go to browser menu → "Install XGEN MRP..."</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <p className="font-medium">Confirm installation</p>
                    <p className="text-sm text-gray-600">Click "Install" in the popup dialog</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <p className="font-medium">Launch the app</p>
                    <p className="text-sm text-gray-600">Find XGEN MRP in your applications or start menu</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Why Install the App?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Tablet-Optimized Performance</p>
                    <p className="text-sm text-gray-600">Landscape layout optimized for professional tablet use</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Offline Manufacturing Data</p>
                    <p className="text-sm text-gray-600">Access production data even without internet connection</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Professional Interface</p>
                    <p className="text-sm text-gray-600">Full manufacturing dashboard on your tablet home screen</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Production Notifications</p>
                    <p className="text-sm text-gray-600">Real-time alerts for manufacturing processes</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Landscape Dashboard</p>
                    <p className="text-sm text-gray-600">Full-screen manufacturing interface without browser bars</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Seamless Updates</p>
                    <p className="text-sm text-gray-600">Latest manufacturing features delivered automatically</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Troubleshooting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-gray-900">Don't see the install option?</p>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-1 space-y-1">
                <li>Make sure you're using a supported browser (Chrome, Safari, Edge)</li>
                <li>Check that you're not already in an installed app</li>
                <li>Try refreshing the page</li>
                <li>Clear your browser cache and try again</li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <p className="font-medium text-gray-900">Need help?</p>
              <p className="text-sm text-gray-600 mb-2">
                If you're having trouble installing the app, contact our support team.
              </p>
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Icon Generation Guide */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-center mb-6">
            For Developers: Icon Setup
          </h2>
          <IconGeneratorSection />
        </div>

        {/* Footer */}
        <div className="text-center mt-8 py-6">
          <p className="text-gray-500 text-sm">
            XGEN MRP • Progressive Web App • Compatible with all modern devices
          </p>
        </div>
      </div>
    </div>
  );
}