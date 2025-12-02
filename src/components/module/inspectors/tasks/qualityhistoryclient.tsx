"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import { useToast } from "@/hooks/use-toast";
import { updateQualityChecks } from "@/lib/actions/inspector/production-order";

export default function QualityHistoryClient({ checks, qualityCheckId }) {
  const [rows, setRows] = useState(checks || []);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const [newEntry, setNewEntry] = useState({
    defect: "",
    solution: "",
    notes: "",
  });

  // 🔥 ADD NEW ENTRY + UPDATE DB
  const addNewRow = async () => {
    if (!newEntry.defect && !newEntry.solution && !newEntry.notes) {
      toast({
        title: "Missing Information",
        description: "Please enter at least one field.",
        variant: "destructive",
      });
      return;
    }

    try {
      // 1️⃣ Save to backend using UPDATED function
      await updateQualityChecks(qualityCheckId, {
        defectsFound: newEntry.defect,
        actionTaken: newEntry.solution,
        notes: newEntry.notes,
      });

      // 2️⃣ Add new row to UI (local view only)
      const entry = {
        id: crypto.randomUUID(),
        defectsFound: newEntry.defect,
        actionTaken: newEntry.solution,
        notes: newEntry.notes,
        createdAt: new Date().toISOString(),
      };

      setRows((prev) => [entry, ...prev]);

      // 3️⃣ Reset form
      setNewEntry({ defect: "", solution: "", notes: "" });
      setShowForm(false);

      toast({
        title: "Entry Added",
        description: "Your update has been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Quality History</h2>

        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add New Entry"}
        </Button>
      </div>

      {/* Add Entry Form */}
      {showForm && (
        <div className="border rounded-lg p-3 bg-gray-50 space-y-3">
          <div>
            <label className="text-sm font-medium">Defect</label>
            <Textarea
              className="mt-1"
              value={newEntry.defect}
              onChange={(e) =>
                setNewEntry({ ...newEntry, defect: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium">Corrective Action</label>
            <Textarea
              className="mt-1"
              value={newEntry.solution}
              onChange={(e) =>
                setNewEntry({ ...newEntry, solution: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              className="mt-1"
              value={newEntry.notes}
              onChange={(e) =>
                setNewEntry({ ...newEntry, notes: e.target.value })
              }
            />
          </div>

          <Button onClick={addNewRow} className="w-full">
            Save Entry
          </Button>
        </div>
      )}

      {/* Data Table */}
      <Table className="border rounded-xl shadow-sm">
        <TableHeader>
          <TableRow className="bg-gray-100">
            <TableHead className="text-center">Defect</TableHead>
            <TableHead className="text-center">Corrective Action</TableHead>
            <TableHead className="text-center">Notes</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-sm py-6 text-gray-500">
                No records yet.
              </TableCell>
            </TableRow>
          )}

          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell
                className="whitespace-pre-line text-center text-sm"
                dangerouslySetInnerHTML={{ __html: row.defectsFound }}
              />
              <TableCell
                className="whitespace-pre-line text-center text-sm"
                dangerouslySetInnerHTML={{ __html: row.actionTaken }}
              />
              <TableCell
                className="whitespace-pre-line text-center text-sm"
                dangerouslySetInnerHTML={{ __html: row.notes }}
              />

            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
