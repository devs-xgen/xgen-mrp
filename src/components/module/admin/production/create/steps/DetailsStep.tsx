"use client";

import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertTriangle } from "lucide-react";

import type { ProductionCreateForm } from "@/lib/validation/production-create";

interface DetailsStepProps {
  form: UseFormReturn<ProductionCreateForm>;
}

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low", color: "bg-gray-500" },
  { value: "MEDIUM", label: "Medium", color: "bg-blue-500" },
  { value: "HIGH", label: "High", color: "bg-orange-500" },
  { value: "URGENT", label: "Urgent", color: "bg-red-500" },
  { value: "CRITICAL", label: "Critical", color: "bg-red-700" },
] as const;

export function DetailsStep({ form }: DetailsStepProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const quantity = watch("quantity");
  const startDate = watch("startDate");
  const dueDate = watch("dueDate");
  const priority = watch("priority");
  const notes = watch("notes");

  // Calculate duration
  const getDurationDays = () => {
    if (!startDate || !dueDate) return null;
    const start = new Date(startDate);
    const due = new Date(dueDate);
    const diffTime = due.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const durationDays = getDurationDays();
  const selectedPriority = PRIORITY_OPTIONS.find((p) => p.value === priority);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Production Details</h3>
        <p className="text-muted-foreground">
          Specify the quantity, timeline, and priority for this production
          order.
        </p>
      </div>

      {/* Quantity */}
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity to Produce *</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          placeholder="Enter quantity"
          {...register("quantity", { valueAsNumber: true })}
        />
        {errors.quantity && (
          <p className="text-sm text-destructive">{errors.quantity.message}</p>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Start Date *
          </Label>
          <Input id="startDate" type="date" {...register("startDate")} />
          {errors.startDate && (
            <p className="text-sm text-destructive">
              {errors.startDate.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Due Date *
          </Label>
          <Input id="dueDate" type="date" {...register("dueDate")} />
          {errors.dueDate && (
            <p className="text-sm text-destructive">{errors.dueDate.message}</p>
          )}
        </div>
      </div>

      {/* Duration Display */}
      {durationDays !== null && (
        <Card
          className={`${durationDays <= 0 ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock
                className={`h-4 w-4 ${durationDays <= 0 ? "text-red-600" : "text-blue-600"}`}
              />
              <span
                className={`font-medium ${durationDays <= 0 ? "text-red-900" : "text-blue-900"}`}
              >
                Duration: {durationDays} {durationDays === 1 ? "day" : "days"}
              </span>
              {durationDays <= 0 && (
                <Badge variant="destructive" className="ml-2">
                  Invalid Duration
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Priority */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Priority *
        </Label>
        <Select
          value={priority}
          onValueChange={(value) => setValue("priority", value as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select priority level" />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${option.color}`} />
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.priority && (
          <p className="text-sm text-destructive">{errors.priority.message}</p>
        )}
      </div>

      {/* Priority Display */}
      {selectedPriority && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${selectedPriority.color}`}
              />
              <span className="font-medium">
                Priority: {selectedPriority.label}
              </span>
              {(priority === "URGENT" || priority === "CRITICAL") && (
                <Badge variant="destructive">High Priority</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Add any special instructions or notes for this production order..."
          rows={3}
          {...register("notes")}
        />
        <p className="text-sm text-muted-foreground">
          Include any special requirements, quality standards, or delivery
          instructions.
        </p>
        {errors.notes && (
          <p className="text-sm text-destructive">{errors.notes.message}</p>
        )}
      </div>
    </div>
  );
}
