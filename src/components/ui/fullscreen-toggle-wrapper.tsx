"use client";

import React, { ReactNode } from "react";
import { FullscreenToggle } from "./fullscreen-toggle";
import { cn } from "@/lib/utils";

interface FullscreenToggleWrapperProps {
  children: ReactNode;
  id: string;
  className?: string;
}

export function FullscreenToggleWrapper({ 
  children, 
  id, 
  className 
}: FullscreenToggleWrapperProps) {
  return (
    <div id={id} className={cn("relative", className)}>
      <div className="absolute top-0 right-0 z-10 p-2">
        <FullscreenToggle containerId={id} />
      </div>
      {children}
    </div>
  );
} 