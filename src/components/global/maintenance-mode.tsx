"use client";

import { AlertTriangle, Wrench, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MaintenanceMode() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping"></div>
              <div className="relative bg-orange-500 p-4 rounded-full">
                <Wrench className="h-12 w-12 text-white animate-pulse" />
              </div>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            System Under Maintenance
          </CardTitle>
          <p className="text-slate-600 dark:text-slate-300 text-lg">
            We&apos;re currently performing system updates to improve your experience
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center space-x-4 p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
            <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            <div className="text-center">
              <p className="font-semibold text-orange-800 dark:text-orange-200">
                XGen MRP System Temporarily Unavailable
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                All services are currently offline for scheduled maintenance
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                  Expected Duration
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Maintenance typically takes 6-10 hours
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <Wrench className="h-5 w-5 text-slate-600 dark:text-slate-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                  What We&apos;re Doing
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  System updates and performance improvements
                </p>
              </div>
            </div>
          </div>

          <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Need Immediate Assistance?
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              For urgent matters, please contact your system administrator
            </p>
          </div>

          <div className="text-center pt-4">
            <div className="inline-flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span>System will be back online shortly</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
