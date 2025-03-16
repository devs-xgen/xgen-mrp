"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { adjustInventory } from "./actions";
import { InventoryItem } from "./data";
import { useFormStatus } from "react-dom";

type InventoryAdjustmentDialogProps = {
  item: InventoryItem;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Submitting..." : "Submit Adjustment"}
    </Button>
  );
}

export function InventoryAdjustmentDialog({
  item,
}: InventoryAdjustmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add");
  const { toast } = useToast();

  async function handleSubmit(formData: FormData) {
    // Add the adjustment type to the form data
    formData.append("type", adjustmentType);

    // Add the item ID to the form data
    formData.append("itemId", item.id);

    const result = await adjustInventory(formData);

    if (result.success) {
      toast({
        title: "Inventory Adjusted",
        description: result.message,
      });
      setOpen(false);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to adjust inventory",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Adjust
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Inventory</DialogTitle>
          <DialogDescription>
            Update the inventory quantity for {item.name}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="current" className="text-right">
                Current
              </Label>
              <div className="col-span-3">
                <Input
                  id="current"
                  value={`${item.currentStock} ${item.unit}`}
                  readOnly
                  disabled
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select
                value={adjustmentType}
                onValueChange={(value) =>
                  setAdjustmentType(value as "add" | "remove")
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add</SelectItem>
                  <SelectItem value="remove">Remove</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <div className="col-span-3">
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  required
                  placeholder={`Enter quantity in ${item.unit}`}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Reason
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="reason"
                  name="reason"
                  required
                  placeholder="Provide a reason for this adjustment"
                  className="resize-none"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
