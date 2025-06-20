// src/components/shared/material/MaterialSelector.tsx
import { useState, useEffect, useRef } from "react";
import { Check, Search, Package, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MaterialStatusBadge } from "./MaterialStatusBadge";
import {
  searchMaterials,
  type MaterialOption,
} from "@/lib/actions/material-search";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  placeholder = "Search for materials...",
  emptyText = "No materials found",
  disabled = false,
  preloadedMaterials,
  excludeMaterialIds = [],
  requiredStock,
  showStockWarnings = true,
}: MaterialSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert preloadedMaterials to MaterialOption format if provided
  const convertedPreloadedMaterials = preloadedMaterials
    ? preloadedMaterials.map((material: any) => {
        return {
          id: material.id,
          name: material.name,
          sku: material.sku,
          costPerUnit: Number(material.costPerUnit),
          currentStock: material.currentStock,
          minimumStockLevel: material.minimumStockLevel,
          unitOfMeasureSymbol: material.unitOfMeasure?.symbol || material.unitOfMeasureSymbol || "",
          unitOfMeasureName: material.unitOfMeasure?.name || material.unitOfMeasureName || "",
          typeId: material.typeId,
          typeName: material.type?.name || material.typeName || "",
        };
      })
    : [];

  // Only log when there are actual issues
  if (open && convertedPreloadedMaterials.length === 0 && materials.length === 0 && !loading) {
    console.log("⚠️ MaterialSelector: No materials available", {
      preloadedCount: preloadedMaterials?.length || 0,
      searchQuery,
      open
    });
  }

  // Initialize materials with preloaded data if available
  useEffect(() => {
    if (convertedPreloadedMaterials.length > 0) {
      setMaterials(convertedPreloadedMaterials);
      console.log("✅ Materials loaded:", convertedPreloadedMaterials.length, "items");
    }
  }, []);

  // Search for materials when query changes (only if no preloaded materials)
  useEffect(() => {
    if (!open || convertedPreloadedMaterials.length > 0) {
      return;
    }

    const fetchMaterials = async () => {
      setLoading(true);
      try {
        const results = await searchMaterials(searchQuery);
        console.log("🔍 Search results for '" + searchQuery + "':", results.length, "materials");
        setMaterials(results);
      } catch (error) {
        console.error("❌ Error searching materials:", error);
        setMaterials([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounced search
    const handler = setTimeout(fetchMaterials, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, open]);

  // Use preloaded materials if available, otherwise use searched materials
  const availableMaterials = convertedPreloadedMaterials.length > 0 
    ? convertedPreloadedMaterials 
    : materials;

  // Filter out excluded materials and apply search filter
  const filteredMaterials = availableMaterials.filter((material) => {
    const matchesExclusion = !excludeMaterialIds.includes(material.id);
    const matchesSearch = searchQuery === "" || 
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesExclusion && matchesSearch;
  });

  // Get material stock status
  const getStockStatus = (material: MaterialOption): "normal" | "low" | "out" => {
    if (material.currentStock <= 0) return "out";
    if (material.currentStock < material.minimumStockLevel) return "low";
    return "normal";
  };

  // Get selected material details
  const selectedMaterial = availableMaterials.find(
    (material) => material.id === value
  );

  // Sort materials by stock status and name
  const sortedMaterials = filteredMaterials.sort((a, b) => {
    // Prioritize materials with good stock
    const aStatus = getStockStatus(a);
    const bStatus = getStockStatus(b);
    
    if (aStatus === "normal" && bStatus !== "normal") return -1;
    if (bStatus === "normal" && aStatus !== "normal") return 1;
    if (aStatus === "low" && bStatus === "out") return -1;
    if (bStatus === "low" && aStatus === "out") return 1;
    
    // Then sort alphabetically
    return a.name.localeCompare(b.name);
  });

  // Handle input focus
  const handleInputFocus = () => {
    console.log("🎯 Input focused - opening selector");
    setIsFocused(true);
    setOpen(true);
    if (selectedMaterial) {
      setSearchQuery(selectedMaterial.name);
    }
  };

  // Handle input blur
  const handleInputBlur = (e: React.FocusEvent) => {
    // Don't close if the new focus target is within the popover
    const relatedTarget = e.relatedTarget as Element;
    if (relatedTarget && relatedTarget.closest('[data-radix-popper-content-wrapper]')) {
      return;
    }
    
    setTimeout(() => {
      setIsFocused(false);
      if (!selectedMaterial) {
        setSearchQuery("");
      }
      setOpen(false);
    }, 150);
  };

  // Handle search query change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    if (newQuery.length > 0) {
      console.log("🔍 Searching for:", newQuery);
    }
  };

  // Handle material selection
  const handleMaterialSelect = (material: MaterialOption) => {
    console.log("✅ Material selected:", material.name);
    onValueChange(material.id, material);
    setSearchQuery(material.name);
    setIsFocused(false);
    setOpen(false);
    // Small delay to ensure the popover closes properly
    setTimeout(() => {
      inputRef.current?.blur();
    }, 100);
  };

  // Handle clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange("", undefined);
    setSearchQuery("");
    setIsFocused(false);
    inputRef.current?.focus();
  };

  // Display value in input
  const displayValue = isFocused ? searchQuery : (selectedMaterial?.name || "");

  return (
    <div className="relative w-full">
      <Popover 
        open={open} 
        onOpenChange={(newOpen) => {
          console.log("📋 Popover state changing:", open, "->", newOpen);
          setOpen(newOpen);
          if (!newOpen) {
            setIsFocused(false);
          }
        }}
      >
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder={selectedMaterial ? selectedMaterial.name : placeholder}
              value={displayValue}
              onChange={handleSearchChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!open) {
                  handleInputFocus();
                }
                // Always focus the input to allow typing
                inputRef.current?.focus();
              }}
              disabled={disabled}
              className={cn(
                "pr-20 pl-10 h-12 text-base",
                selectedMaterial && !isFocused && "font-medium text-gray-900",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            />
            
            {/* Search Icon */}
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            
            {/* Selected Material Info or Clear Button */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              {selectedMaterial && !isFocused && (
                <>
                  <div className="text-xs text-muted-foreground font-mono">
                    {selectedMaterial.sku}
                  </div>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="h-5 w-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                  >
                    <X className="h-3 w-3 text-gray-600" />
                  </button>
                </>
              )}
              
              {selectedMaterial && !isFocused && (
                <MaterialStatusBadge
                  stockStatus={getStockStatus(selectedMaterial)}
                  size="sm"
                />
              )}
            </div>
          </div>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-[--radix-popover-trigger-width] p-0" 
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => {
            // Prevent auto focus on popover content
            e.preventDefault();
            // Keep focus on input for typing
            inputRef.current?.focus();
          }}
          onCloseAutoFocus={(e) => {
            // Prevent auto focus when closing
            e.preventDefault();
          }}
                  >
            <Command 
              shouldFilter={false}
              onMouseDown={(e) => {
                // Prevent the input from losing focus when clicking in the popover
                e.preventDefault();
              }}
            >
              <CommandList>
              {loading ? (
                <div className="py-2 px-3 space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <>
                  <CommandEmpty className="py-6 text-center">
                    <Package className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">{emptyText}</p>
                    {searchQuery && (
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Try searching with different keywords
                      </p>
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    <div className="max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {sortedMaterials.map((material) => {
                        const stockStatus = getStockStatus(material);
                        const isInsufficientStock = requiredStock !== undefined && material.currentStock < requiredStock;
                        
                        return (
                          <CommandItem
                            key={material.id}
                            value={material.id}
                            onSelect={() => {
                              handleMaterialSelect(material);
                            }}
                            onMouseDown={(e) => {
                              // Prevent default to avoid blur on input
                              e.preventDefault();
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!isInsufficientStock) {
                                handleMaterialSelect(material);
                              }
                            }}
                            disabled={isInsufficientStock}
                            className={cn(
                              "px-3 py-3 cursor-pointer transition-colors",
                              isInsufficientStock && "opacity-50 cursor-not-allowed",
                              value === material.id && "bg-accent"
                            )}
                          >
                            <div className="flex w-full items-center gap-3">
                              <Check
                                className={cn(
                                  "h-4 w-4 flex-shrink-0",
                                  value === material.id ? "opacity-100 text-blue-600" : "opacity-0"
                                )}
                              />
                              
                              <div className="flex-1 min-w-0">
                                {/* Material Name - Main Focus */}
                                <div className="font-semibold text-sm text-gray-900 truncate mb-1">
                                  {material.name}
                                </div>
                                
                                {/* Stock and SKU - Simplified */}
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span className="font-medium">
                                    Stock: {material.currentStock} {material.unitOfMeasureSymbol}
                                  </span>
                                  <span className="text-xs font-mono text-muted-foreground/70">
                                    {material.sku}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Stock Status Badge */}
                              <div className="flex-shrink-0">
                                <MaterialStatusBadge
                                  stockStatus={stockStatus}
                                  size="sm"
                                />
                              </div>
                            </div>
                          </CommandItem>
                        );
                                              })}
                    </div>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Selected Material Summary (below input when selected) */}
      {selectedMaterial && !isFocused && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-blue-900">{selectedMaterial.name}</div>
              <div className="text-sm text-blue-700">
                Stock: {selectedMaterial.currentStock} {selectedMaterial.unitOfMeasureSymbol} • SKU: {selectedMaterial.sku}
              </div>
            </div>
            <MaterialStatusBadge stockStatus={getStockStatus(selectedMaterial)} size="sm" />
          </div>
        </div>
      )}
    </div>
  );
}

// Re-export the MaterialOption type for convenience
export type { MaterialOption };
