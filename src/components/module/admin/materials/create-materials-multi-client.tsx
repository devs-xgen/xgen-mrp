// src/components/module/admin/materials/create-materials-multi-client.tsx
"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateMaterialForm, CreateMaterialFormRef } from "./create-material-form";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, ChevronDown, ChevronRight, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createMaterialsBulk } from "@/lib/actions/materials";
import { useRouter } from "next/navigation";

export interface CreateMaterialsMultiClientProps {
  materialTypes: { id: string; name: string }[];
  unitOfMeasures: { id: string; name: string; symbol: string }[];
  suppliers: { id: string; name: string }[];
}

type Section = {
  key: string;
  open: boolean;
};

export function CreateMaterialsMultiClient({ materialTypes, unitOfMeasures, suppliers }: CreateMaterialsMultiClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([{ key: crypto.randomUUID(), open: true }]);
  const refs = useRef<CreateMaterialFormRef[]>([]);

  function addSection() {
    setSections((prev) => {
      // collapse existing and open new one
      const updated = prev.map((s) => ({ ...s, open: false }));
      return [...updated, { key: crypto.randomUUID(), open: true }];
    });
  }

  function removeSection(index: number) {
    setSections((prev) => {
      const copy = [...prev];
      copy.splice(index, 1);
      // keep at least one section
      if (copy.length === 0) copy.push({ key: crypto.randomUUID(), open: true });
      return copy;
    });
    // also remove the ref at index
    refs.current.splice(index, 1);
  }

  async function handleCreateAll() {
    // Validate each section and collect payloads
    const payloads = [] as any[];
    for (let i = 0; i < sections.length; i++) {
      const ref = refs.current[i];
      if (!ref) continue;
      const payload = await ref.validateAndGetPayload();
      if (!payload) {
        // expand invalid section and show message
        setSections((prev) => prev.map((s, idx) => ({ ...s, open: idx === i })));
        toast({ title: "Validation error", description: `Please complete Material ${i + 1} before submitting.`, variant: "destructive" });
        return;
      }
      payloads.push(payload);
    }

    if (payloads.length === 0) {
      toast({ title: "Nothing to create", description: "Please fill at least one material.", variant: "destructive" });
      return;
    }

    const res = await createMaterialsBulk(payloads);
    if ((res as any)?.success) {
      toast({ title: "Created", description: `Inserted ${(res as any).insertedCount} of ${payloads.length} materials` });
      // reset all sections to a single empty form
      setSections([{ key: crypto.randomUUID(), open: true }]);
      refs.current.forEach((r) => r?.reset());
      // navigate back to materials list
      router.push("/admin/materials");
    } else {
      toast({ title: "Error", description: (res as any)?.error || "Failed to create materials", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      {sections.map((section, idx) => (
        <div key={section.key} className="rounded-md border">
          <Collapsible open={section.open} onOpenChange={(open) => setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, open } : s)))}>
            <div className="flex items-center justify-between p-3 border-b bg-muted/20">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="px-2">
                    {section.open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <span>Material {idx + 1}</span>
              </div>
              <div className="flex items-center gap-2">
                {sections.length > 1 && (
                  <Button variant="outline" size="sm" onClick={() => removeSection(idx)}>
                    <Trash className="h-4 w-4 mr-1" /> Remove
                  </Button>
                )}
              </div>
            </div>
            <CollapsibleContent>
              <div className="p-4">
                <CreateMaterialForm
                  ref={(el) => {
                    if (el) refs.current[idx] = el;
                  }}
                  materialTypes={materialTypes}
                  unitOfMeasures={unitOfMeasures}
                  suppliers={suppliers}
                  showBatchControls={false}
                  hideSubmit={true}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      ))}

      <div className="flex justify-between">
        <Button type="button" variant="secondary" onClick={addSection}>
          <Plus className="h-4 w-4 mr-2" /> Add more materials
        </Button>
        <Button type="button" onClick={handleCreateAll}>
          Create {sections.length} Material{sections.length > 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}
