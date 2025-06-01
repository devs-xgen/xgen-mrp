"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm, useFieldArray } from "react-hook-form";
import { useEffect } from "react";

interface MaterialRequestItem {
  inventoryItemId: string;
  quantityRequested: number;
  unit: string;
  notes?: string;
  status: string;
}

interface MaterialRequestFormData {
  requestDate: string; // dates as ISO strings
  requestedById: string;
  requiredDate: string;
  status: string;
  priority: string;
  workCenterId: string;
  productionOrderId?: string;
  notes?: string;
  items: MaterialRequestItem[];
}

interface RequestMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionOrderId: string;
  onSubmit: (data: MaterialRequestFormData) => void;
}

export function RequestMaterialDialog({
  open,
  onOpenChange,
  productionOrderId,
  onSubmit,
}: RequestMaterialDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MaterialRequestFormData>({
    defaultValues: {
      requestDate: new Date().toISOString().slice(0, 10),
      requiredDate: new Date().toISOString().slice(0, 10),
      requestedById: "",
      status: "PENDING",
      priority: "MEDIUM",
      workCenterId: "",
      productionOrderId,
      notes: "",
      items: [{ inventoryItemId: "", quantityRequested: 1, unit: "", status: "PENDING", notes: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset({
        requestDate: new Date().toISOString().slice(0, 10),
        requiredDate: new Date().toISOString().slice(0, 10),
        requestedById: "",
        status: "PENDING",
        priority: "MEDIUM",
        workCenterId: "",
        productionOrderId,
        notes: "",
        items: [{ inventoryItemId: "", quantityRequested: 1, unit: "", status: "PENDING", notes: "" }],
      });
    }
  }, [open, reset, productionOrderId]);

  const internalSubmit = (data: MaterialRequestFormData) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Request Material</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(internalSubmit)}
          className="overflow-auto flex-grow px-2 py-4 space-y-6"
        >
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium" htmlFor="requestDate">
                Request Date
              </label>
              <Input
                type="date"
                id="requestDate"
                {...register("requestDate", { required: "Request Date is required" })}
              />
              {errors.requestDate && (
                <p className="text-xs text-red-600">{errors.requestDate.message}</p>
              )}
            </div>

            <div>
              <label className="block mb-1 font-medium" htmlFor="requiredDate">
                Required Date
              </label>
              <Input
                type="date"
                id="requiredDate"
                {...register("requiredDate", { required: "Required Date is required" })}
              />
              {errors.requiredDate && (
                <p className="text-xs text-red-600">{errors.requiredDate.message}</p>
              )}
            </div>

            <div>
              <label className="block mb-1 font-medium" htmlFor="requestedById">
                Requested By (User ID)
              </label>
              <Input
                id="requestedById"
                {...register("requestedById", { required: "Requested By is required" })}
              />
              {errors.requestedById && (
                <p className="text-xs text-red-600">{errors.requestedById.message}</p>
              )}
            </div>

            <div>
              <label className="block mb-1 font-medium" htmlFor="workCenterId">
                Work Center ID
              </label>
              <Input
                id="workCenterId"
                {...register("workCenterId", { required: "Work Center is required" })}
              />
              {errors.workCenterId && (
                <p className="text-xs text-red-600">{errors.workCenterId.message}</p>
              )}
            </div>

            <div>
              <label className="block mb-1 font-medium" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                {...register("status")}
                className="input input-bordered w-full px-2 py-1 rounded"
              >
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium" htmlFor="priority">
                Priority
              </label>
              <select
                id="priority"
                {...register("priority")}
                className="input input-bordered w-full px-2 py-1 rounded"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block mb-1 font-medium" htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                {...register("notes")}
                className="textarea textarea-bordered w-full"
                rows={2}
                placeholder="Optional notes"
              />
            </div>
          </div>

          {/* Items Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Material Request Items</h3>
            <div
              className="max-h-72 overflow-y-auto border rounded p-4 space-y-4"
              style={{ scrollbarWidth: "thin" }}
            >
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-6 gap-4 items-center border-b pb-2"
                >
                  <div className="col-span-2">
                    <label
                      className="block mb-1 font-medium"
                      htmlFor={`items.${index}.inventoryItemId`}
                    >
                      Inventory Item ID
                    </label>
                    <Input
                      id={`items.${index}.inventoryItemId`}
                      {...register(`items.${index}.inventoryItemId` as const, {
                        required: "Required",
                      })}
                    />
                  </div>

                  <div>
                    <label
                      className="block mb-1 font-medium"
                      htmlFor={`items.${index}.quantityRequested`}
                    >
                      Quantity
                    </label>
                    <Input
                      type="number"
                      id={`items.${index}.quantityRequested`}
                      {...register(`items.${index}.quantityRequested` as const, {
                        required: "Required",
                        min: { value: 1, message: "Min 1" },
                      })}
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-medium" htmlFor={`items.${index}.unit`}>
                      Unit
                    </label>
                    <Input
                      id={`items.${index}.unit`}
                      {...register(`items.${index}.unit` as const, { required: "Required" })}
                    />
                  </div>

                  <div>
                    <label
                      className="block mb-1 font-medium"
                      htmlFor={`items.${index}.status`}
                    >
                      Status
                    </label>
                    <select
                      id={`items.${index}.status`}
                      {...register(`items.${index}.status` as const)}
                      className="input input-bordered w-full px-2 py-1 rounded"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>

                  <div className="col-span-1">
                    <label
                      className="block mb-1 font-medium"
                      htmlFor={`items.${index}.notes`}
                    >
                      Notes
                    </label>
                    <Input
                      id={`items.${index}.notes`}
                      {...register(`items.${index}.notes` as const)}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="flex items-center justify-center">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => remove(index)}
                      size="sm"
                      className="mt-6"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}

              <Button type="button" onClick={() => append({ inventoryItemId: "", quantityRequested: 1, unit: "", status: "PENDING" })}>
                + Add Item
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full mt-4">
            Submit Request
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
