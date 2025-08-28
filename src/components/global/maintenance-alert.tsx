"use client";

import { useState } from "react";
import { AlertTriangle, X, Wrench } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface MaintenanceAlertProps {
  onClose?: () => void;
}

export function MaintenanceAlert({ onClose }: MaintenanceAlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500/95 backdrop-blur-sm border-b border-orange-600 shadow-lg">
      <Alert className="border-0 bg-transparent rounded-none py-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Wrench className="h-5 w-5 text-white animate-pulse" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping"></div>
              </div>
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <AlertDescription className="text-white font-medium text-sm md:text-base">
              <span className="font-bold">System Maintenance Active:</span> The system is currently undergoing maintenance. Some features may be limited or unavailable.
            </AlertDescription>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-white hover:bg-white/20 hover:text-white p-1 h-auto min-w-0 shrink-0 ml-4"
            aria-label="Close maintenance alert"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>
    </div>
  );
}
