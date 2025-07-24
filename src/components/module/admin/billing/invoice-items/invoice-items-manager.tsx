"use client";

import { useState, useCallback, useRef } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, Trash2, GripVertical, Copy, Download, Upload, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { SalesInvoiceItemFormData } from "@/types/admin/billing";
import { formatCurrencyPHP } from "@/lib/constant";
import { InvoiceItemRow } from "./invoice-item-row";
import { InvoiceItemTemplates } from "./invoice-item-templates";
import { BulkItemOperations } from "./bulk-item-operations";
import { InvoiceItemValidation } from "./invoice-item-validation";

interface InvoiceItemsManagerProps {
  items: SalesInvoiceItemFormData[];
  onItemsChange: (items: SalesInvoiceItemFormData[]) => void;
  disabled?: boolean;
  showTemplates?: boolean;
  showBulkOperations?: boolean;
  maxItems?: number;
  errors?: Record<string, string>;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

export function InvoiceItemsManager({
  items,
  onItemsChange,
  disabled = false,
  showTemplates = true,
  showBulkOperations = true,
  maxItems = 50,
  errors = {},
  onValidationChange,
}: InvoiceItemsManagerProps) {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate totals
  const calculateItemTotal = useCallback((item: SalesInvoiceItemFormData): number => {
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = item.discountPercent ? (subtotal * item.discountPercent) / 100 : 0;
    return subtotal - discountAmount;
  }, []);

  const totalAmount = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  // Validation
  const validateItems = useCallback((itemsToValidate: SalesInvoiceItemFormData[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (itemsToValidate.length === 0) {
      errors.push("At least one invoice item is required");
    }

    const validItems = itemsToValidate.filter(item => 
      item.description && 
      item.description.trim().length > 0 && 
      item.quantity > 0 && 
      item.unitPrice >= 0
    );

    if (validItems.length === 0 && itemsToValidate.length > 0) {
      errors.push("At least one valid invoice item is required");
    }

    itemsToValidate.forEach((item, index) => {
      if (!item.description || item.description.trim().length === 0) {
        errors.push(`Item ${index + 1}: Description is required`);
      }
      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (item.unitPrice < 0) {
        errors.push(`Item ${index + 1}: Unit price cannot be negative`);
      }
      if (item.discountPercent && (item.discountPercent < 0 || item.discountPercent > 100)) {
        errors.push(`Item ${index + 1}: Discount must be between 0% and 100%`);
      }
    });

    const isValid = errors.length === 0;
    setValidationErrors(errors);
    onValidationChange?.(isValid, errors);
    
    return { isValid, errors };
  }, [onValidationChange]);

  // Item operations
  const addItem = useCallback((newItem?: Partial<SalesInvoiceItemFormData>) => {
    if (items.length >= maxItems) {
      toast.error(`Maximum ${maxItems} items allowed`);
      return;
    }

    const defaultItem: SalesInvoiceItemFormData = {
      description: "",
      quantity: 1,
      unitPrice: 0,
      productCode: "",
      unit: "PCS",
      discountPercent: 0,
      taxable: true,
      ...newItem,
    };

    const updatedItems = [...items, defaultItem];
    onItemsChange(updatedItems);
    validateItems(updatedItems);
    toast.success("Item added");
  }, [items, maxItems, onItemsChange, validateItems]);

  const updateItem = useCallback((index: number, updatedItem: Partial<SalesInvoiceItemFormData>) => {
    const updatedItems = items.map((item, i) => 
      i === index ? { ...item, ...updatedItem } : item
    );
    onItemsChange(updatedItems);
    validateItems(updatedItems);
  }, [items, onItemsChange, validateItems]);

  const removeItem = useCallback((index: number) => {
    if (items.length <= 1) {
      toast.error("At least one item is required");
      return;
    }

    const updatedItems = items.filter((_, i) => i !== index);
    onItemsChange(updatedItems);
    validateItems(updatedItems);
    
    // Clear selection if removed item was selected
    setSelectedItems(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
    toast.success("Item removed");
  }, [items, onItemsChange, validateItems]);

  const duplicateItem = useCallback((index: number) => {
    if (items.length >= maxItems) {
      toast.error(`Maximum ${maxItems} items allowed`);
      return;
    }

    const itemToDuplicate = { ...items[index] };
    const updatedItems = [...items];
    updatedItems.splice(index + 1, 0, itemToDuplicate);
    onItemsChange(updatedItems);
    validateItems(updatedItems);
    toast.success("Item duplicated");
  }, [items, maxItems, onItemsChange, validateItems]);

  // Drag and drop
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination || disabled) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const updatedItems = Array.from(items);
    const [reorderedItem] = updatedItems.splice(sourceIndex, 1);
    updatedItems.splice(destinationIndex, 0, reorderedItem);

    onItemsChange(updatedItems);
    
    // Update selected items indices
    setSelectedItems(prev => prev.map(selectedIndex => {
      if (selectedIndex === sourceIndex) return destinationIndex;
      if (selectedIndex > sourceIndex && selectedIndex <= destinationIndex) return selectedIndex - 1;
      if (selectedIndex < sourceIndex && selectedIndex >= destinationIndex) return selectedIndex + 1;
      return selectedIndex;
    }));

    toast.success("Items reordered");
  }, [items, onItemsChange, disabled]);

  // Bulk operations
  const handleSelectAll = useCallback(() => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((_, index) => index));
    }
  }, [selectedItems.length, items.length]);

  const handleSelectItem = useCallback((index: number, selected: boolean) => {
    setSelectedItems(prev => 
      selected 
        ? [...prev, index].sort((a, b) => a - b)
        : prev.filter(i => i !== index)
    );
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (selectedItems.length === 0) return;
    
    if (items.length - selectedItems.length < 1) {
      toast.error("Cannot delete all items. At least one item is required.");
      return;
    }

    const updatedItems = items.filter((_, index) => !selectedItems.includes(index));
    onItemsChange(updatedItems);
    validateItems(updatedItems);
    setSelectedItems([]);
    toast.success(`${selectedItems.length} items deleted`);
  }, [selectedItems, items, onItemsChange, validateItems]);

  const handleBulkDuplicate = useCallback(() => {
    if (selectedItems.length === 0) return;
    
    if (items.length + selectedItems.length > maxItems) {
      toast.error(`Cannot duplicate. Would exceed maximum of ${maxItems} items.`);
      return;
    }

    const itemsToDuplicate = selectedItems.map(index => ({ ...items[index] }));
    const updatedItems = [...items, ...itemsToDuplicate];
    onItemsChange(updatedItems);
    validateItems(updatedItems);
    setSelectedItems([]);
    toast.success(`${selectedItems.length} items duplicated`);
  }, [selectedItems, items, maxItems, onItemsChange, validateItems]);

  // Template operations
  const handleApplyTemplate = useCallback((templateItems: SalesInvoiceItemFormData[]) => {
    if (templateItems.length > maxItems) {
      toast.error(`Template has too many items. Maximum ${maxItems} allowed.`);
      return;
    }

    onItemsChange(templateItems);
    validateItems(templateItems);
    setShowTemplateDialog(false);
    toast.success("Template applied");
  }, [maxItems, onItemsChange, validateItems]);

  // Import/Export operations
  const handleExportItems = useCallback(() => {
    const dataStr = JSON.stringify(items, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `invoice-items-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success("Items exported");
  }, [items]);

  const handleImportItems = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedItems = JSON.parse(e.target?.result as string) as SalesInvoiceItemFormData[];
        
        if (!Array.isArray(importedItems)) {
          throw new Error("Invalid file format");
        }

        if (importedItems.length > maxItems) {
          toast.error(`Imported file has too many items. Maximum ${maxItems} allowed.`);
          return;
        }

        // Validate imported items structure
        const validatedItems = importedItems.map(item => ({
          description: item.description || "",
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          productCode: item.productCode || "",
          unit: item.unit || "PCS",
          discountPercent: Number(item.discountPercent) || 0,
          taxable: Boolean(item.taxable),
          productId: item.productId,
          materialId: item.materialId,
          inventoryItemId: item.inventoryItemId,
        }));

        onItemsChange(validatedItems);
        validateItems(validatedItems);
        toast.success(`${validatedItems.length} items imported`);
      } catch (error) {
        toast.error("Failed to import items. Please check file format.");
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [maxItems, onItemsChange, validateItems]);

  return (
    <Card className="bg-card border rounded-lg" role="region" aria-labelledby="invoice-items-title">
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <CardTitle id="invoice-items-title" className="text-lg">Invoice Items</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add and manage items for this invoice
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" role="status" aria-label={`${items.length} of ${maxItems} items`}>
              {items.length} / {maxItems} items
            </Badge>
            <Badge variant="outline" role="status" aria-label={`Total amount: ${formatCurrencyPHP(totalAmount)}`}>
              Total: {formatCurrencyPHP(totalAmount)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <InvoiceItemValidation errors={validationErrors} />
        )}

        {/* Action Bar */}
        <div 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-3 bg-muted/50 rounded-lg"
          role="toolbar"
          aria-label="Invoice items actions"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addItem()}
              disabled={disabled || items.length >= maxItems}
              aria-label={`Add new item (${items.length}/${maxItems} items)`}
            >
              <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
              Add Item
            </Button>

            {showTemplates && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateDialog(true)}
                disabled={disabled}
                aria-label="Use item templates"
              >
                <Zap className="h-4 w-4 mr-1" aria-hidden="true" />
                Templates
              </Button>
            )}

            {showBulkOperations && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowBulkDialog(true)}
                disabled={disabled}
                aria-label="Bulk operations"
              >
                <Copy className="h-4 w-4 mr-1" aria-hidden="true" />
                Bulk Actions
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleExportItems}
              disabled={disabled || items.length === 0}
              aria-label="Export items to file"
            >
              <Download className="h-4 w-4 mr-1" aria-hidden="true" />
              Export
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              aria-label="Import items from file"
            >
              <Upload className="h-4 w-4 mr-1" aria-hidden="true" />
              Import
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportItems}
              className="sr-only"
              aria-label="Select file to import"
            />
          </div>
        </div>

        {/* Bulk Selection Bar */}
        {selectedItems.length > 0 && (
          <div 
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
            role="region"
            aria-label="Bulk selection actions"
          >
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedItems.length === items.length}
                onCheckedChange={handleSelectAll}
                disabled={disabled}
                aria-label={selectedItems.length === items.length ? "Deselect all items" : "Select all items"}
              />
              <span className="text-sm font-medium" role="status">
                {selectedItems.length} of {items.length} items selected
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBulkDuplicate}
                disabled={disabled || items.length + selectedItems.length > maxItems}
                aria-label={`Duplicate ${selectedItems.length} selected items`}
              >
                <Copy className="h-4 w-4 mr-1" aria-hidden="true" />
                Duplicate
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={disabled || items.length - selectedItems.length < 1}
                aria-label={`Delete ${selectedItems.length} selected items`}
              >
                <Trash2 className="h-4 w-4 mr-1" aria-hidden="true" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Items List */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="invoice-items">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`space-y-2 ${snapshot.isDraggingOver ? 'bg-muted/30 rounded-lg p-2' : ''}`}
                role="list"
                aria-label="Invoice items list"
                aria-describedby="items-list-description"
              >
                <div id="items-list-description" className="sr-only">
                  Use arrow keys to navigate, space to select, and drag handles to reorder items
                </div>
                {items.map((item, index) => (
                  <Draggable
                    key={`item-${index}`}
                    draggableId={`item-${index}`}
                    index={index}
                    isDragDisabled={disabled}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${snapshot.isDragging ? 'shadow-lg' : ''}`}
                        role="listitem"
                        aria-label={`Invoice item ${index + 1}: ${item.description || 'New item'}`}
                      >
                        <InvoiceItemRow
                          item={item}
                          index={index}
                          onUpdate={(updatedItem) => updateItem(index, updatedItem)}
                          onRemove={() => removeItem(index)}
                          onDuplicate={() => duplicateItem(index)}
                          onSelect={(selected) => handleSelectItem(index, selected)}
                          selected={selectedItems.includes(index)}
                          disabled={disabled}
                          dragHandleProps={provided.dragHandleProps}
                          canRemove={items.length > 1}
                          errors={errors}
                          total={calculateItemTotal(item)}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Summary */}
        <Separator />
        <div 
          className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-muted/30 rounded-lg"
          role="region"
          aria-labelledby="invoice-summary-title"
        >
          <div id="invoice-summary-title" className="sr-only">Invoice totals summary</div>
          <div className="text-sm text-muted-foreground" role="status">
            Total Quantity: <span className="font-medium">{totalQuantity}</span>
          </div>
          <div className="text-lg font-semibold" role="status" aria-label={`Total amount: ${formatCurrencyPHP(totalAmount)}`}>
            Total Amount: {formatCurrencyPHP(totalAmount)}
          </div>
        </div>

        {/* Empty State */}
        {items.length === 0 && (
          <div className="text-center py-8" role="region" aria-labelledby="empty-state-title">
            <h3 id="empty-state-title" className="sr-only">No invoice items</h3>
            <p className="text-muted-foreground mb-4">No items added yet</p>
            <Button
              type="button"
              onClick={() => addItem()}
              disabled={disabled}
              aria-label="Add your first invoice item"
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Add Your First Item
            </Button>
          </div>
        )}
      </CardContent>

      {/* Template Dialog */}
      {showTemplateDialog && (
        <InvoiceItemTemplates
          open={showTemplateDialog}
          onClose={() => setShowTemplateDialog(false)}
          onApplyTemplate={handleApplyTemplate}
          disabled={disabled}
        />
      )}

      {/* Bulk Operations Dialog */}
      {showBulkDialog && (
        <BulkItemOperations
          open={showBulkDialog}
          onClose={() => setShowBulkDialog(false)}
          onAddMultiple={(items) => {
            const updatedItems = [...items, ...items];
            if (updatedItems.length <= maxItems) {
              onItemsChange(updatedItems);
              validateItems(updatedItems);
              setShowBulkDialog(false);
              toast.success(`${items.length} items added`);
            } else {
              toast.error(`Cannot add items. Would exceed maximum of ${maxItems}.`);
            }
          }}
          disabled={disabled}
          maxItems={maxItems}
          currentItemCount={items.length}
        />
      )}
    </Card>
  );
}