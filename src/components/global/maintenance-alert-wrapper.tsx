"use client";

import { useMaintenanceMode } from "@/components/providers/maintenance-provider";
import { MaintenanceAlert } from "@/components/global/maintenance-alert";

export function MaintenanceAlertWrapper() {
  const { showAlert, dismissAlert } = useMaintenanceMode();
  
  if (!showAlert) return null;
  
  return <MaintenanceAlert onClose={dismissAlert} />;
}
