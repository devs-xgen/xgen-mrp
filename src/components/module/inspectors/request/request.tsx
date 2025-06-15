// "use client";

// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";
// import { toast } from "sonner";

// interface InventoryIssueReportFormProps {
//   inventoryItems: { id: string; name: string }[];
//   onSubmit?: (data: any) => Promise<void>;
//   reportedById: string;
// }

// export function InventoryIssueReportForm({
//   inventoryItems,
//   onSubmit,
//   reportedById,
// }: InventoryIssueReportFormProps) {
//   const [inventoryItemId, setInventoryItemId] = useState("");
//   const [reportType, setReportType] = useState("");
//   const [severity, setSeverity] = useState("");
//   const [description, setDescription] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!inventoryItemId || !reportType || !severity || !description) {
//       toast.error("Please fill in all required fields.");
//       return;
//     }

//     setIsSubmitting(true);
//     try {
//       if (onSubmit) {
//         await onSubmit({
//           inventoryItemId,
//           reportType,
//           severity,
//           description,
//           reportedById,
//         });
//         toast.success("Issue report submitted!");
//         // Optionally reset form here
//         setInventoryItemId("");
//         setReportType("");
//         setSeverity("");
//         setDescription("");
//       }
//     } catch (err) {
//       toast.error("Failed to submit issue report.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
//       <h2 className="text-2xl font-bold mb-2">Report Inventory Issue</h2>

//       {/* Inventory Item */}
//       <div>
//         <label className="block text-sm font-medium mb-1">
//           Inventory Item <span className="text-red-500">*</span>
//         </label>
//         <Select value={inventoryItemId} onValueChange={setInventoryItemId}>
//           <SelectTrigger>
//             <SelectValue placeholder="Select item..." />
//           </SelectTrigger>
//           <SelectContent>
//             {inventoryItems.map((item) => (
//               <SelectItem key={item.id} value={item.id}>
//                 {item.name}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//       </div>

//       {/* Report Type */}
//       <div>
//         <label className="block text-sm font-medium mb-1">
//           Issue Type <span className="text-red-500">*</span>
//         </label>
//         <Select value={reportType} onValueChange={setReportType}>
//           <SelectTrigger>
//             <SelectValue placeholder="Select issue type..." />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
//             <SelectItem value="DISCREPANCY">Discrepancy</SelectItem>
//             <SelectItem value="DAMAGE">Damage</SelectItem>
//             <SelectItem value="QUALITY">Quality Issue</SelectItem>
//             <SelectItem value="OTHER">Other</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       {/* Severity */}
//       <div>
//         <label className="block text-sm font-medium mb-1">
//           Severity <span className="text-red-500">*</span>
//         </label>
//         <Select value={severity} onValueChange={setSeverity}>
//           <SelectTrigger>
//             <SelectValue placeholder="Select severity..." />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="LOW">Low</SelectItem>
//             <SelectItem value="MEDIUM">Medium</SelectItem>
//             <SelectItem value="HIGH">High</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       {/* Description */}
//       <div>
//         <label className="block text-sm font-medium mb-1">
//           Description <span className="text-red-500">*</span>
//         </label>
//         <Textarea
//           value={description}
//           onChange={e => setDescription(e.target.value)}
//           placeholder="Describe the issue in detail..."
//           className="min-h-[100px]"
//           required
//         />
//       </div>

//       <Button type="submit" disabled={isSubmitting} className="w-full">
//         {isSubmitting ? "Submitting..." : "Submit Issue"}
//       </Button>
//     </form>
//   );
// }


"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function MaterialRequestForm({
  inventoryItems,
  materialRequestId,
  onSuccess,
}: {
  inventoryItems: { id: string; name: string; unit: string }[];
  materialRequestId: string;
  onSuccess?: () => void;
}) {
  const [inventoryItemId, setInventoryItemId] = useState("");
  const [quantityRequested, setQuantityRequested] = useState("");
  const [unit, setUnit] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update unit automatically when item changes
  const handleItemChange = (id: string) => {
    setInventoryItemId(id);
    const item = inventoryItems.find((i) => i.id === id);
    setUnit(item?.unit || "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryItemId || !quantityRequested || !unit) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/material-request-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialRequestId,
          inventoryItemId,
          quantityRequested: Number(quantityRequested),
          unit,
          notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit request");
      toast.success("Material request sent!");
      setInventoryItemId("");
      setQuantityRequested("");
      setUnit("");
      setNotes("");
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error("Failed to send material request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-2">Request Material</h2>
      <div>
        <label className="block text-sm mb-1">Material <span className="text-red-500">*</span></label>
        <Select value={inventoryItemId} onValueChange={handleItemChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select material..." />
          </SelectTrigger>
          <SelectContent>
            {inventoryItems.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-sm mb-1">Quantity <span className="text-red-500">*</span></label>
        <Input
          type="number"
          value={quantityRequested}
          min={1}
          onChange={e => setQuantityRequested(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Unit <span className="text-red-500">*</span></label>
        <Input
          value={unit}
          onChange={e => setUnit(e.target.value)}
          placeholder="e.g. kg, pcs"
          required
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Notes</label>
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Optional notes for the admin"
        />
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Sending..." : "Send Request"}
      </Button>
    </form>
  );
}
