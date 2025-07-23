"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Save, X, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";

import { SalesInvoiceItemFormData } from "@/types/admin/billing";
import { formatCurrencyPHP } from "@/lib/constant";

interface InvoiceItemTemplate {
  id: string;
  name: string;
  description?: string;
  items: SalesInvoiceItemFormData[];
  createdAt: Date;
  usageCount: number;
}

interface InvoiceItemTemplatesProps {
  open: boolean;
  onClose: () => void;
  onApplyTemplate: (items: SalesInvoiceItemFormData[]) => void;
  disabled?: boolean;
}

// Default templates
const DEFAULT_TEMPLATES: InvoiceItemTemplate[] = [
  {
    id: 'basic-service',
    name: 'Basic Service Package',
    description: 'Standard service items for basic projects',
    items: [
      {
        description: 'Consultation Service',
        quantity: 1,
        unitPrice: 2500,
        productCode: 'CONSULT-001',
        unit: 'HR',
        discountPercent: 0,
        taxable: true,
      },
      {
        description: 'Implementation Service',
        quantity: 8,
        unitPrice: 1500,
        productCode: 'IMPL-001',
        unit: 'HR',
        discountPercent: 0,
        taxable: true,
      },
      {
        description: 'Documentation',
        quantity: 1,
        unitPrice: 1000,
        productCode: 'DOC-001',
        unit: 'SET',
        discountPercent: 0,
        taxable: true,
      },
    ],
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: 'product-bundle',
    name: 'Product Bundle',
    description: 'Common product combinations',
    items: [
      {
        description: 'Main Product',
        quantity: 1,
        unitPrice: 5000,
        productCode: 'PROD-001',
        unit: 'PCS',
        discountPercent: 0,
        taxable: true,
      },
      {
        description: 'Accessory Kit',
        quantity: 1,
        unitPrice: 1200,
        productCode: 'ACC-001',
        unit: 'SET',
        discountPercent: 10,
        taxable: true,
      },
      {
        description: 'Installation Service',
        quantity: 2,
        unitPrice: 800,
        productCode: 'INSTALL-001',
        unit: 'HR',
        discountPercent: 0,
        taxable: true,
      },
    ],
    createdAt: new Date(),
    usageCount: 0,
  },
  {
    id: 'maintenance-package',
    name: 'Maintenance Package',
    description: 'Regular maintenance service items',
    items: [
      {
        description: 'Monthly Maintenance',
        quantity: 12,
        unitPrice: 500,
        productCode: 'MAINT-001',
        unit: 'MONTH',
        discountPercent: 15,
        taxable: true,
      },
      {
        description: 'Emergency Support',
        quantity: 1,
        unitPrice: 2000,
        productCode: 'SUPPORT-001',
        unit: 'YEAR',
        discountPercent: 0,
        taxable: true,
      },
    ],
    createdAt: new Date(),
    usageCount: 0,
  },
];

export function InvoiceItemTemplates({
  open,
  onClose,
  onApplyTemplate,
  disabled = false,
}: InvoiceItemTemplatesProps) {
  const [templates, setTemplates] = useState<InvoiceItemTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceItemTemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InvoiceItemTemplate | null>(null);

  // Load templates from localStorage on mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('invoice-item-templates');
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates);
        setTemplates([...DEFAULT_TEMPLATES, ...parsed]);
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    }
  }, []);

  // Save templates to localStorage
  const saveTemplates = (updatedTemplates: InvoiceItemTemplate[]) => {
    const customTemplates = updatedTemplates.filter(t => !DEFAULT_TEMPLATES.find(dt => dt.id === t.id));
    localStorage.setItem('invoice-item-templates', JSON.stringify(customTemplates));
    setTemplates(updatedTemplates);
  };

  const handleApplyTemplate = (template: InvoiceItemTemplate) => {
    // Update usage count
    const updatedTemplates = templates.map(t => 
      t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
    );
    saveTemplates(updatedTemplates);
    
    onApplyTemplate(template.items);
    toast.success(`Template "${template.name}" applied`);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (DEFAULT_TEMPLATES.find(t => t.id === templateId)) {
      toast.error("Cannot delete default templates");
      return;
    }

    const updatedTemplates = templates.filter(t => t.id !== templateId);
    saveTemplates(updatedTemplates);
    toast.success("Template deleted");
  };

  const calculateTemplateTotal = (items: SalesInvoiceItemFormData[]): number => {
    return items.reduce((sum, item) => {
      const subtotal = item.quantity * item.unitPrice;
      const discountAmount = item.discountPercent ? (subtotal * item.discountPercent) / 100 : 0;
      return sum + (subtotal - discountAmount);
    }, 0);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Invoice Item Templates
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Choose a template to quickly add common item combinations
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateDialog(true)}
                disabled={disabled}
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Template
              </Button>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        {template.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {template.items.length} items
                        </Badge>
                        {template.usageCount > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Used {template.usageCount}x
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {/* Preview first few items */}
                      {template.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="truncate flex-1 mr-2">{item.description}</span>
                          <span className="text-muted-foreground">
                            {item.quantity} × {formatCurrencyPHP(item.unitPrice)}
                          </span>
                        </div>
                      ))}
                      
                      {template.items.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{template.items.length - 3} more items
                        </div>
                      )}

                      <Separator />
                      
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total:</span>
                        <span className="font-semibold">
                          {formatCurrencyPHP(calculateTemplateTotal(template.items))}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyTemplate(template);
                          }}
                          disabled={disabled}
                          className="flex-1"
                        >
                          Apply Template
                        </Button>
                        
                        {!DEFAULT_TEMPLATES.find(t => t.id === template.id) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTemplate(template);
                              }}
                              disabled={disabled}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTemplate(template.id);
                              }}
                              disabled={disabled}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {templates.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No templates available</p>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(true)}
                  disabled={disabled}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Template
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Template Dialog */}
      <CreateTemplateDialog
        open={showCreateDialog || !!editingTemplate}
        onClose={() => {
          setShowCreateDialog(false);
          setEditingTemplate(null);
        }}
        onSave={(template) => {
          if (editingTemplate) {
            // Update existing template
            const updatedTemplates = templates.map(t => 
              t.id === editingTemplate.id ? template : t
            );
            saveTemplates(updatedTemplates);
            toast.success("Template updated");
          } else {
            // Create new template
            const newTemplate = {
              ...template,
              id: `custom-${Date.now()}`,
              createdAt: new Date(),
              usageCount: 0,
            };
            saveTemplates([...templates, newTemplate]);
            toast.success("Template created");
          }
          setShowCreateDialog(false);
          setEditingTemplate(null);
        }}
        initialTemplate={editingTemplate}
        disabled={disabled}
      />
    </>
  );
}

interface CreateTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (template: Omit<InvoiceItemTemplate, 'id' | 'createdAt' | 'usageCount'>) => void;
  initialTemplate?: InvoiceItemTemplate | null;
  disabled?: boolean;
}

function CreateTemplateDialog({
  open,
  onClose,
  onSave,
  initialTemplate,
  disabled = false,
}: CreateTemplateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<SalesInvoiceItemFormData[]>([
    {
      description: '',
      quantity: 1,
      unitPrice: 0,
      productCode: '',
      unit: 'PCS',
      discountPercent: 0,
      taxable: true,
    }
  ]);

  // Initialize form with template data
  useEffect(() => {
    if (initialTemplate) {
      setName(initialTemplate.name);
      setDescription(initialTemplate.description || '');
      setItems(initialTemplate.items);
    } else {
      setName('');
      setDescription('');
      setItems([{
        description: '',
        quantity: 1,
        unitPrice: 0,
        productCode: '',
        unit: 'PCS',
        discountPercent: 0,
        taxable: true,
      }]);
    }
  }, [initialTemplate, open]);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }

    const validItems = items.filter(item => 
      item.description.trim() && item.quantity > 0 && item.unitPrice >= 0
    );

    if (validItems.length === 0) {
      toast.error("At least one valid item is required");
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      items: validItems,
    });
  };

  const addItem = () => {
    setItems([...items, {
      description: '',
      quantity: 1,
      unitPrice: 0,
      productCode: '',
      unit: 'PCS',
      discountPercent: 0,
      taxable: true,
    }]);
  };

  const updateItem = (index: number, updatedItem: Partial<SalesInvoiceItemFormData>) => {
    const updatedItems = items.map((item, i) => 
      i === index ? { ...item, ...updatedItem } : item
    );
    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialTemplate ? 'Edit Template' : 'Create New Template'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Info */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter template name"
                disabled={disabled}
              />
            </div>
            <div>
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                disabled={disabled}
                rows={2}
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Template Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                disabled={disabled}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                      <div className="md:col-span-2">
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(index, { description: e.target.value })}
                          placeholder="Item description"
                          disabled={disabled}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, { quantity: parseFloat(e.target.value) || 0 })}
                          min="0"
                          step="0.01"
                          disabled={disabled}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Unit Price</Label>
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                          min="0"
                          step="0.01"
                          disabled={disabled}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Discount %</Label>
                        <Input
                          type="number"
                          value={item.discountPercent || 0}
                          onChange={(e) => updateItem(index, { discountPercent: parseFloat(e.target.value) || 0 })}
                          min="0"
                          max="100"
                          step="0.01"
                          disabled={disabled}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                          disabled={disabled || items.length <= 1}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={disabled}>
            <Save className="h-4 w-4 mr-2" />
            {initialTemplate ? 'Update Template' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}