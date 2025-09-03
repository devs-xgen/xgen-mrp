"use client";

import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { WifiOff, RefreshCw, Home } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="h-8 w-8 text-gray-500" />
          </div>
          <CardTitle className="text-xl text-gray-900">You&apos;re Offline</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            No internet connection detected. Check your connection and try again.
          </p>
          
          <div className="space-y-2">
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </Link>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            Some features may still be available offline if you&apos;ve used them before.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}