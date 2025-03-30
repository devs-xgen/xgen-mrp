// src/components/shared/material/MaterialSelector.tsx
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { MaterialStatusBadge } from "./MaterialStatusBadge";
import { MaterialCostDisplay } from "./MaterialCostDisplay";
import {
  searchMaterials,
  type MaterialOption,
} from "@/lib/actions/material-search";
import { Skeleton } from "@/components/ui/skeleton";

interface MaterialSelectorProps {
  value: string;
  onValueChange: (value: string, material?: MaterialOption) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  preloadedMaterials?: MaterialOption[];
  excludeMaterialIds?: string[]; // For filtering out already selected materials
  requiredStock?: number; // To check if there's enough stock
  showStockWarnings?: boolean;
}

export function MaterialSelector({
  value,
  onValueChange,
  placeholder = "Select a material",
  emptyText = "No materials found",
  disabled = false,
  preloadedMaterials,
  excludeMaterialIds = [],
  requiredStock,
  showStockWarnings = true,
}: MaterialSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [materials, setMaterials] = useState<MaterialOption[]>(
    preloadedMaterials || []
  );
  const [loading, setLoading] = useState(!preloadedMaterials);

  // Search for materials when query changes
  useEffect(() => {
    if (!open || preloadedMaterials) return;

    const fetchMaterials = async () => {
      if (searchQuery.length === 0 && materials.length > 0) return;

      setLoading(true);
      try {
        const results = await searchMaterials(searchQuery);
        setMaterials(results);
      } catch (error) {
        console.error("Error searching materials:", error);
      } finally {
        setLoading(false);
      }
    };

    // Debounced search
    const handler = setTimeout(fetchMaterials, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, open, preloadedMaterials, materials.length]);

  // Filter out excluded materials and apply search filter
  const filteredMaterials = (preloadedMaterials || materials).filter(
    (material) =>
      !excludeMaterialIds.includes(material.id) &&
      (material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Check if material has enough stock
  const hasEnoughStock = (material: MaterialOption) => {
    if (!requiredStock) return true;
    return material.currentStock >= requiredStock;
  };

  // Get material stock status
  const getStockStatus = (
    material: MaterialOption
  ): "normal" | "low" | "out" => {
    if (material.currentStock <= 0) return "out";
    if (material.currentStock < material.minimumStockLevel) return "low";
    return "normal";
  };

  // Get selected material details
  const selectedMaterial = filteredMaterials.find(
    (material) => material.id === value
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            disabled === true ? "opacity-50 cursor-not-allowed" : ""
          )}
          disabled={disabled === true}
        >
          {selectedMaterial ? (
            <div className="flex items-center text-left truncate">
              <span className="truncate">{selectedMaterial.name}</span>
              <span className="ml-2 text-xs text-muted-foreground truncate">
                ({selectedMaterial.sku})
              </span>
              {showStockWarnings && !hasEnoughStock(selectedMaterial) && (
                <AlertTriangle className="ml-auto h-4 w-4 text-amber-500" />
              )}
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            placeholder="Search materials..."
            onValueChange={setSearchQuery}
          />
          {loading ? (
            <div className="py-2 px-1 space-y-1">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup className="max-h-[300px] overflow-y-auto">
                {filteredMaterials.map((material) => (
                  <CommandItem
                    key={material.id}
                    value={material.id}
                    onSelect={() => {
                      onValueChange(material.id, material);
                      setOpen(false);
                    }}
                    disabled={
                      requiredStock !== undefined &&
                      material.currentStock < requiredStock
                    }
                    className={cn(
                      "flex flex-col items-start py-2",
                      requiredStock &&
                        material.currentStock < requiredStock &&
                        "opacity-50"
                    )}
                  >
                    <div className="flex w-full justify-between items-center">
                      <div className="flex items-center">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === material.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span>{material.name}</span>
                      </div>
                      <MaterialStatusBadge
                        stockStatus={getStockStatus(material)}
                        size="sm"
                      />
                    </div>
                    <div className="ml-6 flex w-full justify-between text-xs text-muted-foreground mt-1">
                      <div>
                        <span>SKU: {material.sku}</span>
                        <span className="mx-1">•</span>
                        <span>
                          Stock: {material.currentStock}{" "}
                          {material.unitOfMeasureSymbol}
                        </span>
                      </div>
                      <MaterialCostDisplay cost={material.costPerUnit} />
                    </div>
                    {showStockWarnings &&
                      requiredStock &&
                      material.currentStock < requiredStock && (
                        <div className="ml-6 mt-1 text-xs text-amber-600 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          <span>
                            Insufficient stock ({material.currentStock}/
                            {requiredStock})
                          </span>
                        </div>
                      )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Re-export the MaterialOption type for convenience
export type { MaterialOption };
