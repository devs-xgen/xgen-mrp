"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";

interface PWAStatus {
  serviceWorker: boolean;
  manifest: boolean;
  https: boolean;
  icons: boolean;
  installable: boolean;
  standalone: boolean;
}

export function PWAStatusChecker() {
  const [status, setStatus] = useState<PWAStatus>({
    serviceWorker: false,
    manifest: false,
    https: false,
    icons: false,
    installable: false,
    standalone: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPWAStatus = async () => {
      const newStatus: PWAStatus = {
        serviceWorker: false,
        manifest: false,
        https: false,
        icons: false,
        installable: false,
        standalone: false,
      };

      // Check HTTPS
      newStatus.https = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

      // Check Service Worker
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          newStatus.serviceWorker = registrations.length > 0;
        } catch (error) {
          console.error('Service Worker check failed:', error);
        }
      }

      // Check Standalone mode
      newStatus.standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;

      // Check Manifest
      try {
        const response = await fetch('/manifest.json');
        if (response.ok) {
          const manifest = await response.json();
          newStatus.manifest = !!(manifest.name && manifest.start_url);
          newStatus.icons = !!(manifest.icons && manifest.icons.length >= 2);
        }
      } catch (error) {
        console.error('Manifest check failed:', error);
      }

      // Check installability (this is set by beforeinstallprompt event)
      const handleBeforeInstallPrompt = () => {
        newStatus.installable = true;
        setStatus({ ...newStatus });
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      setStatus(newStatus);
      setLoading(false);

      // Cleanup
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    };

    checkPWAStatus();
  }, []);

  const StatusIcon = ({ passed }: { passed: boolean }) => {
    if (loading) return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
    return passed ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = (passed: boolean) => {
    if (loading) return <Badge variant="outline">Checking...</Badge>;
    return passed ? 
      <Badge className="bg-green-100 text-green-800">Passed</Badge> : 
      <Badge variant="destructive">Failed</Badge>;
  };

  const checks = [
    {
      name: "HTTPS/Localhost",
      description: "Running on secure connection or localhost",
      passed: status.https,
      required: true,
    },
    {
      name: "Service Worker",
      description: "Service worker registered and active",
      passed: status.serviceWorker,
      required: true,
    },
    {
      name: "Web App Manifest",
      description: "Valid manifest.json file present",
      passed: status.manifest,
      required: true,
    },
    {
      name: "App Icons",
      description: "Required icon sizes available",
      passed: status.icons,
      required: true,
    },
    {
      name: "Install Prompt",
      description: "Browser shows install prompt",
      passed: status.installable,
      required: false,
    },
    {
      name: "Standalone Mode",
      description: "App is installed and running standalone",
      passed: status.standalone,
      required: false,
    },
  ];

  const requiredPassed = checks.filter(check => check.required && check.passed).length;
  const totalRequired = checks.filter(check => check.required).length;
  const allRequiredPassed = requiredPassed === totalRequired;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : allRequiredPassed ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-orange-600" />
          )}
          PWA Installation Requirements
        </CardTitle>
        <p className="text-sm text-gray-600">
          {loading ? (
            "Checking PWA requirements..."
          ) : allRequiredPassed ? (
            "✅ All requirements met! Your app should be installable."
          ) : (
            `❌ ${requiredPassed}/${totalRequired} required checks passed. Install prompt may not appear.`
          )}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <StatusIcon passed={check.passed} />
                <div>
                  <p className="font-medium text-sm">
                    {check.name}
                    {check.required && <span className="text-red-500 ml-1">*</span>}
                  </p>
                  <p className="text-xs text-gray-500">{check.description}</p>
                </div>
              </div>
              {getStatusBadge(check.passed)}
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Even if all requirements are met, the install prompt may not appear immediately. 
            Chrome requires "user engagement" and may delay the prompt. Try interacting with the page or visiting multiple times.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}