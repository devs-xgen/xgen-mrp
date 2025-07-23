"use client";

import { useState } from "react";
import { Plus, Copy, Upload, Download, FileText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { SalesInvoiceItemFormData } from "@/types/admin/billing";
import { formatCurrencyPHP } from "@/lib/constant";

interface BulkItemOperationsProps {
  open: boolean;
  onClose: () => void;
  onAddMultiple: (items: SalesInvoiceItemFormData[]) => void;
  disabled?: boolean;
  maxItems: number;
  currentItemCount: number;
}

export function BulkItemOperations({
  open,
  onClose,
  onAddMultiple,
  disabled = false,
  maxItems,
  currentItemCount,
}: BulkItemOperationsProps) {
  const [activeTab, setActiveTab] = useState("multiple");

  const remainingSlots = maxItems - currentItemCount;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Bulk Item Operations
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Info */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="text-sm">
              <span className="text-muted-foreground">Current items: </span>
              <span className="font-medium">{currentItemCount}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Available slots: </span>
              <Badge variant={remainingSlots > 10 ? "secondary" : "destructive"}>
                {remainingSlots}
              </Badge>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="multiple">Add Multiple</TabsTrigger>
              <TabsTrigger value="csv">Import CSV</TabsTrigger>
              <TabsTrigger value="template">Quick Template</TabsTrigger>
            </TabsList>

            <TabsContent value="multiple" className="space-y-4">
              <AddMultipleItems
                onAddItems={onAddMultiple}
                onClose={onClose}
                disabled={disabled}
                maxItems={remainingSlots}
              />
            </TabsContent>

            <TabsContent value="csv" className="space-y-4">
              <ImportCSVItems
                onAddItems={onAddMultiple}
                onClose={onClose}
                disabled={disabled}
                maxItems={remainingSlots}
              />
            </TabsContent>

            <TabsContent value="template" className="space-y-4">
              <QuickTemplate
                onAddItems={onAddMultiple}
                onClose={onClose}
                disabled={disabled}
                maxItems={remainingSlots}
              />
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AddMultipleItemsProps {
  onAddItems: (items: SalesInvoiceItemFormData[]) => void;
  onClose: () => void;
  disabled: boolean;
  maxItems: number;
}

function AddMultipleItems({ onAddItems, onClose, disabled, maxItems }: AddMultipleItemsProps) {
  const [count, setCount] = useState(5);
  const [baseItem, setBaseItem] = useState<SalesInvoiceItemFormData>({
    description: "",
    quantity: 1,
    unitPrice: 0,
    productCode: "",
    unit: "PCS",
    discountPercent: 0,
    taxable: true,
  });

  const handleAddMultiple = () => {
    if (count > maxItems) {
      toast.error(`Cannot add ${count} items. Only ${maxItems} slots available.`);
      return;
    }

    if (!baseItem.description.trim()) {
      toast.error("Base item description is required");
      return;
    }

    const items: SalesInvoiceItemFormData[] = Array.from({ length: count }, (_, index) => ({
      ...baseItem,
      description: `${baseItem.description} ${index + 1}`,
    }));

    onAddItems(items);
    onClose();
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          Create multiple similar items at once. Each item will be numbered automatically.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="item-count">Number of Items</Label>
          <Input
            id="item-count"
            type="number"
            value={count}
            onChange={(e) => setCount(Math.min(parseInt(e.target.value) || 1, maxItems))}
            min="1"
            max={maxItems}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Maximum: {maxItems} items
          </p>
        </div>

        <div>
          <Label htmlFor="base-unit">Unit</Label>
          <Select
            value={baseItem.unit || 'PCS'}
            onValueChange={(value) => setBaseItem(prev => ({ ...prev, unit: value }))}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["PCS", "SET", "KG", "G", "L", "ML", "M", "CM", "MM", "SQ M", "CU M", "HR", "DAY", "BOX", "PACK", "ROLL"].map(unit => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="base-description">Base Description</Label>
        <Input
          id="base-description"
          value={baseItem.description}
          onChange={(e) => setBaseItem(prev => ({ ...prev, description: e.target.value }))}
          placeholder="e.g., Product Item"
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Items will be named: "{baseItem.description} 1", "{baseItem.description} 2", etc.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="base-quantity">Quantity</Label>
          <Input
            id="base-quantity"
            type="number"
            value={baseItem.quantity}
            onChange={(e) => setBaseItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))}
            min="0"
            step="0.01"
            disabled={disabled}
          />
        </div>

        <div>
          <Label htmlFor="base-price">Unit Price</Label>
          <Input
            id="base-price"
            type="number"
            value={baseItem.unitPrice}
            onChange={(e) => setBaseItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
            min="0"
            step="0.01"
            disabled={disabled}
          />
        </div>

        <div>
          <Label htmlFor="base-discount">Discount %</Label>
          <Input
            id="base-discount"
            type="number"
            value={baseItem.discountPercent || 0}
            onChange={(e) => setBaseItem(prev => ({ ...prev, discountPercent: parseFloat(e.target.value) || 0 }))}
            min="0"
            max="100"
            step="0.01"
            disabled={disabled}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="base-code">Product Code (Optional)</Label>
        <Input
          id="base-code"
          value={baseItem.productCode || ''}
          onChange={(e) => setBaseItem(prev => ({ ...prev, productCode: e.target.value }))}
          placeholder="SKU or product code"
          disabled={disabled}
        />
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: Math.min(count, 3) }, (_, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{baseItem.description} {index + 1}</span>
                <span>{baseItem.quantity} × {formatCurrencyPHP(baseItem.unitPrice)}</span>
              </div>
            ))}
            {count > 3 && (
              <div className="text-xs text-muted-foreground">
                +{count - 3} more items
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total ({count} items):</span>
              <span>{formatCurrencyPHP(count * baseItem.quantity * baseItem.unitPrice)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleAddMultiple}
        disabled={disabled || !baseItem.description.trim() || count > maxItems}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add {count} Items
      </Button>
    </div>
  );
}

interface ImportCSVItemsProps {
  onAddItems: (items: SalesInvoiceItemFormData[]) => void;
  onClose: () => void;
  disabled: boolean;
  maxItems: number;
}

function ImportCSVItems({ onAddItems, onClose, disabled, maxItems }: ImportCSVItemsProps) {
  const [csvData, setCsvData] = useState('');
  const [parsedItems, setParsedItems] = useState<SalesInvoiceItemFormData[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const sampleCSV = `description,quantity,unitPrice,productCode,unit,discountPercent,taxable
"Product A",1,100.00,"PROD-A","PCS",0,true
"Product B",2,50.00,"PROD-B","PCS",10,true
"Service C",1,200.00,"SERV-C","HR",0,true`;

  const parseCSV = (csvText: string) => {
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV must have at least a header and one data row');
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const requiredHeaders = ['description', 'quantity', 'unitPrice'];
      
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
      }

      const items: SalesInvoiceItemFormData[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        const item: any = {};
        
        headers.forEach((header, index) => {
          item[header] = values[index] || '';
        });

        items.push({
          description: item.description || '',
          quantity: parseFloat(item.quantity) || 1,
          unitPrice: parseFloat(item.unitPrice) || 0,
          productCode: item.productCode || '',
          unit: item.unit || 'PCS',
          discountPercent: parseFloat(item.discountPercent) || 0,
          taxable: item.taxable === 'true' || item.taxable === '1',
        });
      }

      if (items.length > maxItems) {
        throw new Error(`CSV contains ${items.length} items, but only ${maxItems} slots available`);
      }

      setParsedItems(items);
      setParseError(null);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Failed to parse CSV');
      setParsedItems([]);
    }
  };

  const handleImport = () => {
    if (parsedItems.length === 0) {
      toast.error('No valid items to import');
      return;
    }

    onAddItems(parsedItems);
    onClose();
  };

  const downloadSample = () => {
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice-items-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          Import items from a CSV file. Required columns: description, quantity, unitPrice.
          Optional: productCode, unit, discountPercent, taxable.
        </AlertDescription>
      </Alert>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={downloadSample}
          disabled={disabled}
        >
          <Download className="h-4 w-4 mr-1" />
          Download Sample
        </Button>
        <span className="text-sm text-muted-foreground">
          Use this as a template for your CSV file
        </span>
      </div>

      <div>
        <Label htmlFor="csv-data">CSV Data</Label>
        <Textarea
          id="csv-data"
          value={csvData}
          onChange={(e) => {
            setCsvData(e.target.value);
            if (e.target.value.trim()) {
              parseCSV(e.target.value);
            } else {
              setParsedItems([]);
              setParseError(null);
            }
          }}
          placeholder="Paste your CSV data here..."
          rows={8}
          disabled={disabled}
        />
      </div>

      {parseError && (
        <Alert variant="destructive">
          <AlertDescription>{parseError}</AlertDescription>
        </Alert>
      )}

      {parsedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Preview ({parsedItems.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {parsedItems.slice(0, 5).map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="truncate flex-1 mr-2">{item.description}</span>
                  <span>{item.quantity} × {formatCurrencyPHP(item.unitPrice)}</span>
                </div>
              ))}
              {parsedItems.length > 5 && (
                <div className="text-xs text-muted-foreground">
                  +{parsedItems.length - 5} more items
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handleImport}
        disabled={disabled || parsedItems.length === 0 || !!parseError}
        className="w-full"
      >
        <Upload className="h-4 w-4 mr-2" />
        Import {parsedItems.length} Items
      </Button>
    </div>
  );
}

interface QuickTemplateProps {
  onAddItems: (items: SalesInvoiceItemFormData[]) => void;
  onClose: () => void;
  disabled: boolean;
  maxItems: number;
}

function QuickTemplate({ onAddItems, onClose, disabled, maxItems }: QuickTemplateProps) {
  const quickTemplates = [
    {
      name: "Basic Service Items",
      items: [
        { description: "Consultation", quantity: 1, unitPrice: 2000, unit: "HR" },
        { description: "Implementation", quantity: 8, unitPrice: 1500, unit: "HR" },
        { description: "Documentation", quantity: 1, unitPrice: 1000, unit: "SET" },
      ]
    },
    {
      name: "Product Package",
      items: [
        { description: "Main Product", quantity: 1, unitPrice: 5000, unit: "PCS" },
        { description: "Accessories", quantity: 1, unitPrice: 1200, unit: "SET", discountPercent: 10 },
        { description: "Installation", quantity: 2, unitPrice: 800, unit: "HR" },
      ]
    },
    {
      name: "Monthly Services",
      items: [
        { description: "Monthly Maintenance", quantity: 12, unitPrice: 500, unit: "MONTH", discountPercent: 15 },
        { description: "Support Package", quantity: 1, unitPrice: 2000, unit: "YEAR" },
      ]
    },
  ];

  const handleApplyTemplate = (templateItems: any[]) => {
    if (templateItems.length > maxItems) {
      toast.error(`Template has ${templateItems.length} items, but only ${maxItems} slots available`);
      return;
    }

    const items: SalesInvoiceItemFormData[] = templateItems.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      productCode: '',
      unit: item.unit || 'PCS',
      discountPercent: item.discountPercent || 0,
      taxable: true,
    }));

    onAddItems(items);
    onClose();
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          Choose from pre-defined item combinations for common scenarios.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-3">
        {quickTemplates.map((template, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{template.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {template.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex justify-between text-sm">
                    <span className="truncate flex-1 mr-2">{item.description}</span>
                    <span>{item.quantity} × {formatCurrencyPHP(item.unitPrice)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between items-center">
                  <Badge variant="secondary">{template.items.length} items</Badge>
                  <span className="font-medium">
                    {formatCurrencyPHP(
                      template.items.reduce((sum, item) => {
                        const subtotal = item.quantity * item.unitPrice;
                        const discount = item.discountPercent ? (subtotal * item.discountPercent) / 100 : 0;
                        return sum + (subtotal - discount);
                      }, 0)
                    )}
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleApplyTemplate(template.items)}
                  disabled={disabled || template.items.length > maxItems}
                  className="w-full mt-2"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Use This Template
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}