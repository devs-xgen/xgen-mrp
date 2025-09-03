"use client";

import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Package, Wrench, Info } from "lucide-react";

import type { ProductionCreateForm } from "@/lib/validation/production-create";

interface OptionsStepProps {
  form: UseFormReturn<ProductionCreateForm>;
}

export function OptionsStep({ form }: OptionsStepProps) {
  const { watch, setValue } = form;

  const generateBOM = watch("generateBOM");
  const reserveMaterials = watch("reserveMaterials");

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Production Options</h3>
        <p className="text-muted-foreground">
          Configure additional options for material planning and reservation.
        </p>
      </div>

      {/* Generate BOM Option */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-5 w-5" />
            Bill of Materials (BOM)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="generateBOM" className="text-base font-medium">
                Generate BOM automatically
              </Label>
              <p className="text-sm text-muted-foreground">
                Create material requirements based on product specifications
              </p>
            </div>
            <Switch
              id="generateBOM"
              checked={generateBOM}
              onCheckedChange={(checked) => {
                setValue("generateBOM", checked);
                // If BOM generation is disabled, also disable material reservation
                if (!checked) {
                  setValue("reserveMaterials", false);
                }
              }}
            />
          </div>

          {generateBOM && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">BOM Generation Enabled</p>
                  <p>
                    The system will automatically calculate material
                    requirements based on:
                  </p>
                  <ul className="list-disc list-inside mt-1 ml-2">
                    <li>Product variant BOM (if variant selected)</li>
                    <li>Base product BOM (fallback)</li>
                    <li>Production quantity and waste percentage</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reserve Materials Option */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-5 w-5" />
            Material Reservation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label
                htmlFor="reserveMaterials"
                className="text-base font-medium"
              >
                Reserve materials automatically
              </Label>
              <p className="text-sm text-muted-foreground">
                Reserve available inventory for this production order
              </p>
            </div>
            <Switch
              id="reserveMaterials"
              checked={reserveMaterials}
              onCheckedChange={(checked) =>
                setValue("reserveMaterials", checked)
              }
              disabled={!generateBOM}
            />
          </div>

          {!generateBOM && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-gray-600 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium">BOM Required</p>
                  <p>
                    Material reservation requires BOM generation to be enabled.
                  </p>
                </div>
              </div>
            </div>
          )}

          {generateBOM && reserveMaterials && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium">Material Reservation Enabled</p>
                  <p>
                    The system will attempt to reserve materials from available
                    inventory:
                  </p>
                  <ul className="list-disc list-inside mt-1 ml-2">
                    <li>Full reservations when stock is sufficient</li>
                    <li>Partial reservations when stock is limited</li>
                    <li>Warnings for materials with insufficient stock</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Options Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Generate BOM:</span>
              <Badge variant={generateBOM ? "default" : "secondary"}>
                {generateBOM ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Reserve Materials:</span>
              <Badge variant={reserveMaterials ? "default" : "secondary"}>
                {reserveMaterials ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Note</p>
                <p>
                  These options can be changed later, but it&apos;s recommended to
                  enable them now for better production planning and inventory
                  management.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
