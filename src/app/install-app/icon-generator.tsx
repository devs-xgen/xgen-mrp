"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Download, ExternalLink } from "lucide-react";
import { useState } from "react";

export function IconGeneratorSection() {
  const [copiedText, setCopiedText] = useState<string>("");

  const iconSizes = [
    { size: "72x72", usage: "Small app icon" },
    { size: "96x96", usage: "Standard app icon" },
    { size: "128x128", usage: "Chrome extension" },
    { size: "144x144", usage: "Windows tile" },
    { size: "152x152", usage: "iOS home screen" },
    { size: "192x192", usage: "Android home screen (required)" },
    { size: "384x384", usage: "Android splash screen" },
    { size: "512x512", usage: "Android splash screen (required)" },
  ];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const manifestCode = `{
  "name": "XGEN MRP - Manufacturing Resource Planning",
  "short_name": "XGEN MRP",
  "description": "Complete manufacturing resource planning system",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    ${iconSizes.map(icon => `{
      "src": "/images/icons/icon-${icon.size}.png",
      "sizes": "${icon.size}",
      "type": "image/png",
      "purpose": "maskable any"
    }`).join(',\n    ')}
  ]
}`;

  return (
    <div className="space-y-6">
      {/* Icon Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            PWA Icon Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <p className="text-sm text-gray-600 mb-4">
              To make your PWA installable, you need icons in the following sizes:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {iconSizes.map((icon) => (
                <div key={icon.size} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <code className="text-sm font-mono bg-white px-2 py-1 rounded">
                      icon-{icon.size}.png
                    </code>
                    <p className="text-xs text-gray-500 mt-1">{icon.usage}</p>
                  </div>
                  <Badge variant={icon.size === "192x192" || icon.size === "512x512" ? "default" : "outline"}>
                    {icon.size === "192x192" || icon.size === "512x512" ? "Required" : "Recommended"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Icon Generation Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Icon Generation Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Use these online tools to generate all required icon sizes from your logo:
          </p>
          
          <div className="grid gap-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">PWA Builder Icon Generator</p>
                <p className="text-sm text-gray-500">Official Microsoft tool for PWA icons</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://www.pwabuilder.com/imageGenerator', '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">App Manifest Generator</p>
                <p className="text-sm text-gray-500">Generate icons and manifest file</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://app-manifest.firebaseapp.com/', '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Favicon & App Icon Generator</p>
                <p className="text-sm text-gray-500">Comprehensive icon generation tool</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://realfavicongenerator.net/', '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Structure */}
      <Card>
        <CardHeader>
          <CardTitle>File Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
            <pre>{`public/images/icons/
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png
├── icon-384x384.png
├── icon-512x512.png
├── admin-shortcut.png
├── worker-shortcut.png
└── inspector-shortcut.png`}</pre>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(
                "public/images/icons/\n├── icon-72x72.png\n├── icon-96x96.png\n├── icon-128x128.png\n├── icon-144x144.png\n├── icon-152x152.png\n├── icon-192x192.png\n├── icon-384x384.png\n├── icon-512x512.png\n├── admin-shortcut.png\n├── worker-shortcut.png\n└── inspector-shortcut.png",
                "structure"
              )}
            >
              <Copy className="mr-2 h-4 w-4" />
              {copiedText === "structure" ? "Copied!" : "Copy Structure"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manifest Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Manifest Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Here&apos;s how your icons are configured in the PWA manifest:
          </p>
          
          <div className="bg-gray-900 text-gray-300 p-4 rounded-lg font-mono text-xs overflow-x-auto">
            <pre>{manifestCode}</pre>
          </div>
          
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(manifestCode, "manifest")}
            >
              <Copy className="mr-2 h-4 w-4" />
              {copiedText === "manifest" ? "Copied!" : "Copy Manifest"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}