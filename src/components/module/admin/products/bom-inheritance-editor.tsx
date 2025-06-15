"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Settings,
  Package,
  Edit,
  Trash2,
  Save,
  X,
  AlertCircle,
  Info,
  Palette,
  Ruler,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";

// Common sizes for modifiers
const COMMON_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

// Common colors
const COMMON_COLORS = ["Black", "White", "Navy", "Red", "Blue", "Green", "Gray", "Brown"];

// Schema for BOM modification
const bomModificationSchema = z.object({
  materialId: z.string(),
  materialName: z.string(),
  materialSku: z.string(),
  baseQuantity: z.number(),
  quantityModifier: z.number().min(0.1).max(10),
  sizeModifiers: z.record(z.string(), z.number().min(0.1).max(10)).optional(),
  colorSubstitutions: z.record(z.string(), z.string()).optional(),
  notes: z.string().optional(),
});

type BOMModification = z.infer<typeof bomModificationSchema>;

interface BOMInheritanceEditorProps {
  productId: string;
  productName: string;
  parentBOMs: Array<{
    id: string;
    materialId: string;
    materialName: string;
    materialSku: string;
    quantityNeeded: number;
    wastePercentage: number;
    unitCost: number;
  }>;
  sizes: string[];
  colors: string[];
  onSave?: (modifications: BOMModification[]) => void;
  trigger?: React.ReactNode;
}

export function BOMInheritanceEditor({
  productId,
  productName,
  parentBOMs,
  sizes,
  colors,
  onSave,
  trigger,
}: BOMInheritanceEditorProps) {
  const [open, setOpen] = useState(false);
  const [modifications, setModifications] = useState<BOMModification[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Initialize modifications from parent BOMs
  useEffect(() => {
    if (parentBOMs.length > 0 && modifications.length === 0) {
      const initialMods = parentBOMs.map((bom) => ({
        materialId: bom.materialId,
        materialName: bom.materialName,
        materialSku: bom.materialSku,
        baseQuantity: bom.quantityNeeded,
        quantityModifier: 1.0,
        sizeModifiers: {},
        colorSubstitutions: {},
        notes: "",
      }));
      setModifications(initialMods);
    }
  }, [parentBOMs, modifications.length]);

  // Form for editing material modification
  const form = useForm<BOMModification>({
    resolver: zodResolver(bomModificationSchema),
    defaultValues: {
      materialId: "",
      materialName: "",
      materialSku: "",
      baseQuantity: 0,
      quantityModifier: 1.0,
      sizeModifiers: {},
      colorSubstitutions: {},
      notes: "",
    },
  });

  // Start editing a material
  const startEditing = (index: number) => {
    const mod = modifications[index];
    form.reset(mod);
    setEditingIndex(index);
    setSelectedMaterial(mod.materialId);
  };

  // Save material modification
  const saveModification = (data: BOMModification) => {
    if (editingIndex !== null) {
      const updatedMods = [...modifications];
      updatedMods[editingIndex] = data;
      setModifications(updatedMods);
      setEditingIndex(null);
      form.reset();
      setSelectedMaterial("");
      toast({
        title: "Success",
        description: `Updated BOM modification for ${data.materialName}`,
      });
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingIndex(null);
    form.reset();
    setSelectedMaterial("");
  };

  // Update size modifier
  const updateSizeModifier = (size: string, modifier: number) => {
    const currentMods = form.getValues("sizeModifiers") || {};
    currentMods[size] = modifier;
    form.setValue("sizeModifiers", currentMods);
  };

  // Remove size modifier
  const removeSizeModifier = (size: string) => {
    const currentMods = form.getValues("sizeModifiers") || {};
    delete currentMods[size];
    form.setValue("sizeModifiers", currentMods);
  };

  // Update color substitution
  const updateColorSubstitution = (color: string, materialId: string) => {
    const currentSubs = form.getValues("colorSubstitutions") || {};
    currentSubs[color] = materialId;
    form.setValue("colorSubstitutions", currentSubs);
  };

  // Remove color substitution
  const removeColorSubstitution = (color: string) => {
    const currentSubs = form.getValues("colorSubstitutions") || {};
    delete currentSubs[color];
    form.setValue("colorSubstitutions", currentSubs);
  };

  // Get available materials for substitution (excluding current material)
  const getAvailableMaterials = () => {
    const currentMaterialId = form.getValues("materialId");
    return parentBOMs.filter((bom) => bom.materialId !== currentMaterialId);
  };

  // Handle save
  const handleSave = () => {
    onSave?.(modifications);
    setOpen(false);
    toast({
      title: "Success",
      description: "BOM inheritance configuration saved",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Configure BOM Inheritance
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>BOM Inheritance Configuration</DialogTitle>
          <DialogDescription>
            Configure how materials are inherited and modified for each size and color
            variant of <strong>{productName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Material Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Materials Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modifications.map((mod, index) => (
                  <div
                    key={mod.materialId}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{mod.materialName}</h4>
                      <Badge variant="outline">{mod.materialSku}</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>Base Quantity: {mod.baseQuantity}</div>
                      <div>Modifier: {mod.quantityModifier}x</div>
                      <div>
                        Size Modifiers: {Object.keys(mod.sizeModifiers || {}).length}
                      </div>
                      <div>
                        Color Substitutions: {Object.keys(mod.colorSubstitutions || {}).length}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing(index)}
                      className="w-full"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Configure
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Material Configuration Form */}
          {editingIndex !== null && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Settings className="mr-2 h-5 w-5" />
                    Configure: {form.getValues("materialName")}
                  </span>
                  <Button variant="ghost" size="sm" onClick={cancelEditing}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(saveModification)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium">Material</label>
                        <div className="mt-1">
                          <Badge variant="outline">{form.getValues("materialSku")}</Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {form.getValues("materialName")}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Base Quantity</label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {form.getValues("baseQuantity")} units
                        </p>
                      </div>
                      <FormField
                        control={form.control}
                        name="quantityModifier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Global Modifier</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                min="0.1"
                                max="10"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormDescription>
                              Multiplier applied to all variants
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Tabs defaultValue="sizes" className="w-full">
                      <TabsList>
                        <TabsTrigger value="sizes">Size Modifiers</TabsTrigger>
                        <TabsTrigger value="colors">Color Substitutions</TabsTrigger>
                        <TabsTrigger value="notes">Notes</TabsTrigger>
                      </TabsList>

                      <TabsContent value="sizes" className="space-y-4">
                        <div className="flex items-center space-x-2 mb-4">
                          <Ruler className="h-5 w-5" />
                          <h4 className="font-medium">Size-Specific Modifiers</h4>
                        </div>
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Configure different quantity multipliers for each size.
                            Leave blank to use the global modifier.
                          </AlertDescription>
                        </Alert>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {sizes.map((size) => {
                            const currentModifier = form.getValues("sizeModifiers")?.[size];
                            return (
                              <div key={size} className="space-y-2">
                                <label className="text-sm font-medium">{size}</label>
                                <div className="flex space-x-1">
                                  <Input
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    max="10"
                                    placeholder="1.0"
                                    value={currentModifier || ""}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value);
                                      if (!isNaN(value)) {
                                        updateSizeModifier(size, value);
                                      } else if (e.target.value === "") {
                                        removeSizeModifier(size);
                                      }
                                    }}
                                  />
                                  {currentModifier && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeSizeModifier(size)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </TabsContent>

                      <TabsContent value="colors" className="space-y-4">
                        <div className="flex items-center space-x-2 mb-4">
                          <Palette className="h-5 w-5" />
                          <h4 className="font-medium">Color-Specific Material Substitutions</h4>
                        </div>
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Use different materials for specific colors.
                            For example, use red thread for red variants.
                          </AlertDescription>
                        </Alert>
                        <div className="space-y-3">
                          {colors.map((color) => {
                            const currentSub = form.getValues("colorSubstitutions")?.[color];
                            return (
                              <div key={color} className="flex items-center space-x-4">
                                <div className="w-16">
                                  <Badge variant="outline">{color}</Badge>
                                </div>
                                <div className="flex-1">
                                  <Select
                                    value={currentSub || ""}
                                    onValueChange={(value) => {
                                      if (value === "") {
                                        removeColorSubstitution(color);
                                      } else {
                                        updateColorSubstitution(color, value);
                                      }
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select substitute material" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="">No substitution</SelectItem>
                                      {getAvailableMaterials().map((material) => (
                                        <SelectItem
                                          key={material.materialId}
                                          value={material.materialId}
                                        >
                                          {material.materialName} ({material.materialSku})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                {currentSub && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeColorSubstitution(color)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </TabsContent>

                      <TabsContent value="notes">
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <textarea
                                  {...field}
                                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                  placeholder="Add notes about this material's usage or modifications..."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                    </Tabs>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={cancelEditing}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        Save Configuration
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Base Qty</TableHead>
                    <TableHead>Modifier</TableHead>
                    <TableHead>Size Modifiers</TableHead>
                    <TableHead>Color Substitutions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modifications.map((mod, index) => (
                    <TableRow key={mod.materialId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{mod.materialName}</div>
                          <div className="text-sm text-muted-foreground">
                            {mod.materialSku}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{mod.baseQuantity}</TableCell>
                      <TableCell>{mod.quantityModifier}x</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(mod.sizeModifiers || {}).map(([size, modifier]) => (
                            <Badge key={size} variant="secondary" className="text-xs">
                              {size}: {modifier}x
                            </Badge>
                          ))}
                          {Object.keys(mod.sizeModifiers || {}).length === 0 && (
                            <span className="text-sm text-muted-foreground">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(mod.colorSubstitutions || {}).map(([color, materialId]) => {
                            const material = parentBOMs.find(b => b.materialId === materialId);
                            return (
                              <Badge key={color} variant="outline" className="text-xs">
                                {color}: {material?.materialName}
                              </Badge>
                            );
                          })}
                          {Object.keys(mod.colorSubstitutions || {}).length === 0 && (
                            <span className="text-sm text-muted-foreground">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(index)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-2 pt-6 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 