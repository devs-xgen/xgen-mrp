"use client";

import { useState, useCallback, useEffect } from "react";
import { GripVertical, Trash2, Copy, AlertCircle } from "lucide-react";
import { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { SalesInvoiceItemFormData } from "@/types/admin/billing";
import { formatCurrencyPHP } from "@/lib/constant";

interface InvoiceItemRowProps {
  item: SalesInvoiceItemFormData;
  index: number;
  onUpdate: (updatedItem: Partial<SalesInvoiceItemFormData>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onSelect: (selected: boolean) => void;
  selected: boolean;
  disabled?: boolean;
  dragHandleProps?: DraggableProvidedDragHandleProps;
  canRemove: boolean;
  errors?: Record<string, string>;
  total: number;
}

const COMMON_UNITS = [
  "PCS", "SET", "KG", "G", "L", "ML", "M", "CM", "MM", 
  "SQ M", "CU M", "HR", "DAY", "BOX", "PACK", "ROLL"
];

export function InvoiceItemRow({
  item,
  index,
  onUpdate,
  onRemove,
  onDuplicate,
  onSelect,
  selected,
  disabled = false,
  dragHandleProps,
  canRemove,
  errors = {},
  total,
}: InvoiceItemRowProps) {
  const [localItem, setLocalItem] = useState(item);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Sync with parent when item changes
  useEffect(() => {
    setLocalItem(item);
  }, [item]);

  // Real-time validation
  const validateItem = useCallback((itemToValidate: SalesInvoiceItemFormData): string[] => {
    const errors: string[] = [];
    
    if (!itemToValidate.description || itemToValidate.description.trim().length === 0) {
      errors.push("Description is required");
    }
    
    if (itemToValidate.quantity <= 0) {
      errors.push("Quantity must be greater than 0");
    }
    
    if (itemToValidate.unitPrice < 0) {
      errors.push("Unit price cannot be negative");
    }
    
    if (itemToValidate.discountPercent && (itemToValidate.discountPercent < 0 || itemToValidate.discountPercent > 100)) {
      errors.push("Discount must be between 0% and 100%");
    }

    return errors;
  }, []);

  // Handle field updates with validation
  const handleFieldUpdate = useCallback((field: keyof SalesInvoiceItemFormData, value: any) => {
    const updatedItem = { ...localItem, [field]: value };
    setLocalItem(updatedItem);
    
    // Validate and update parent
    const errors = validateItem(updatedItem);
    setValidationErrors(errors);
    
    onUpdate({ [field]: value });
  }, [localItem, onUpdate, validateItem]);

  // Calculate subtotal and discount
  const subtotal = localItem.quantity * localItem.unitPrice;
  const discountAmount = localItem.discountPercent ? (subtotal * localItem.discountPercent) / 100 : 0;
  const hasErrors = validationErrors.length > 0;

  return (
    <Card className={`transition-all duration-200 ${selected ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : ''} ${hasErrors ? 'border-red-300 dark:border-red-700' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="flex items-center justify-center w-6 h-6 mt-6 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Selection Checkbox */}
          <div className="flex items-center justify-center w-6 h-6 mt-6">
            <Checkbox
              checked={selected}
              onCheckedChange={onSelect}
              disabled={disabled}
            />
          </div>

          {/* Item Number */}
          <div className="flex items-center justify-center w-8 h-6 mt-6">
            <Badge variant="outline" className="text-xs">
              {index + 1}
            </Badge>
          </div>

          {/* Main Form Fields */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Description - spans 4 columns */}
            <div className="md:col-span-4 space-y-1">
              <Label htmlFor={`description-${index}`} className="text-xs font-medium">
                Description *
              </Label>
              <Input
                id={`description-${index}`}
                value={localItem.description}
                onChange={(e) => handleFieldUpdate('description', e.target.value)}
                placeholder="Item description"
                disabled={disabled}
                className={hasErrors && !localItem.description ? 'border-red-300 dark:border-red-700' : ''}
              />
            </div>

            {/* Product Code - spans 2 columns */}
            <div className="md:col-span-2 space-y-1">
              <Label htmlFor={`productCode-${index}`} className="text-xs font-medium">
                Code
              </Label>
              <Input
                id={`productCode-${index}`}
                value={localItem.productCode || ''}
                onChange={(e) => handleFieldUpdate('productCode', e.target.value)}
                placeholder="SKU/Code"
                disabled={disabled}
              />
            </div>

            {/* Quantity - spans 1 column */}
            <div className="md:col-span-1 space-y-1">
              <Label htmlFor={`quantity-${index}`} className="text-xs font-medium">
                Qty *
              </Label>
              <Input
                id={`quantity-${index}`}
                type="number"
                value={localItem.quantity}
                onChange={(e) => handleFieldUpdate('quantity', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                disabled={disabled}
                className={hasErrors && localItem.quantity <= 0 ? 'border-red-300 dark:border-red-700' : ''}
              />
            </div>

            {/* Unit - spans 1 column */}
            <div className="md:col-span-1 space-y-1">
              <Label htmlFor={`unit-${index}`} className="text-xs font-medium">
                Unit
              </Label>
              <Select
                value={localItem.unit || 'PCS'}
                onValueChange={(value) => handleFieldUpdate('unit', value)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_UNITS.map(unit => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unit Price - spans 2 columns */}
            <div className="md:col-span-2 space-y-1">
              <Label htmlFor={`unitPrice-${index}`} className="text-xs font-medium">
                Unit Price *
              </Label>
              <Input
                id={`unitPrice-${index}`}
                type="number"
                value={localItem.unitPrice}
                onChange={(e) => handleFieldUpdate('unitPrice', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                disabled={disabled}
                className={hasErrors && localItem.unitPrice < 0 ? 'border-red-300 dark:border-red-700' : ''}
              />
            </div>

            {/* Discount % - spans 1 column */}
            <div className="md:col-span-1 space-y-1">
              <Label htmlFor={`discount-${index}`} className="text-xs font-medium">
                Disc %
              </Label>
              <Input
                id={`discount-${index}`}
                type="number"
                value={localItem.discountPercent || 0}
                onChange={(e) => handleFieldUpdate('discountPercent', parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.01"
                disabled={disabled}
                className={hasErrors && localItem.discountPercent && (localItem.discountPercent < 0 || localItem.discountPercent > 100) ? 'border-red-300 dark:border-red-700' : ''}
              />
            </div>

            {/* Taxable Checkbox - spans 1 column */}
            <div className="md:col-span-1 space-y-1">
              <Label className="text-xs font-medium">Tax</Label>
              <div className="flex items-center justify-center h-9">
                <Checkbox
                  checked={localItem.taxable}
                  onCheckedChange={(checked) => handleFieldUpdate('taxable', checked)}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center gap-1 mt-6">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onDuplicate}
                    disabled={disabled}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Duplicate item</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    disabled={disabled || !canRemove}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{canRemove ? 'Remove item' : 'Cannot remove last item'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Calculation Summary */}
        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Subtotal: {formatCurrencyPHP(subtotal)}</span>
            {discountAmount > 0 && (
              <span>Discount: -{formatCurrencyPHP(discountAmount)}</span>
            )}
            <span className="flex items-center gap-1">
              Taxable: {localItem.taxable ? '✓' : '✗'}
            </span>
          </div>
          <div className="text-lg font-semibold">
            Total: {formatCurrencyPHP(total)}
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700 dark:text-red-300">
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, errorIndex) => (
                    <li key={errorIndex}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}