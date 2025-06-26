// src/components/module/admin/customer-orders/create-dialog.tsx
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { 
  Plus, 
  X, 
  AlertTriangle, 
  CalendarIcon, 
  ShoppingCart, 
  Search, 
  Package, 
  Layers,
  ChevronRight,
  ChevronDown,
  Trash2,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createCustomerOrder } from "@/lib/actions/customer-order";
import { useToast } from "@/hooks/use-toast";
import { CustomerCombobox } from "./combobox-field";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { createProductionOrder } from "@/lib/actions/production-order";
import { useRouter } from "next/navigation";
import { convertDecimals } from "@/lib/convertDecimals";
import { ProductWithVariantsForOrder, CreateCustomerOrderInput } from "@/types/admin/customer-order";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

// Format currency utility function
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
};

// Selected order item interface
interface SelectedOrderItem {
  id: string; // Unique identifier for this line item
  productId: string;
  productName: string;
  productSku: string;
  variantId?: string;
  variantName?: string;
  variantSku?: string;
  displayName: string; // What to show in the cart
  quantity: number;
  unitPrice: number;
  currentStock: number;
  minimumStockLevel: number;
  isVariant: boolean;
}

// Define schema for the form
const formSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  orderDate: z.date({
    required_error: "Order date is required",
  }),
  requiredDate: z.date({
    required_error: "Required date is required",
  }),
  notes: z.string().optional(),
     orderLines: z
     .array(
       z.object({
         productId: z.string().min(1, "Product is required"),
         productVariantId: z.string().optional(),
         quantity: z.number().min(1, "Quantity must be at least 1"),
         unitPrice: z.number().min(0, "Price must be positive"),
       })
     )
     .min(1, "At least one order line is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface Customer {
  id: string;
  name: string;
  email?: string;
}

interface CreateCustomerOrderDialogProps {
  customers: Customer[];
  products: ProductWithVariantsForOrder[];
  workCenters?: any[];
}

export function CreateCustomerOrderDialog({
  customers,
  products,
  workCenters = [],
}: CreateCustomerOrderDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showProductionPrompt, setShowProductionPrompt] = React.useState(false);
  const [lowStockProducts, setLowStockProducts] = React.useState<any[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedItems, setSelectedItems] = React.useState<SelectedOrderItem[]>([]);
  const [expandedProducts, setExpandedProducts] = React.useState<Set<string>>(new Set());
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderDate: new Date(),
      notes: "",
      orderLines: [],
    },
  });

  // Toggle product expansion
  const toggleProductExpansion = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  // Filter products based on search
  const filteredProducts = products.filter((product) => {
    const matchesSearch = searchQuery === "" || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.variants?.some(variant => 
        variant.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        variant.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesSearch;
  });

  // Get stock status for display
  const getStockStatus = (currentStock: number, minimumStock: number): "normal" | "low" | "out" => {
    if (currentStock <= 0) return "out";
    if (currentStock < minimumStock) return "low";
    return "normal";
  };

  // Add entire product (all variants or base product) to cart
  const addEntireProduct = (product: ProductWithVariantsForOrder) => {
    if (product.hasVariants && product.variants && product.variants.length > 0) {
      // Add all variants
      product.variants.forEach(variant => {
        addItemToCart(product, variant);
      });
    } else {
      // Add base product
      addItemToCart(product);
    }
  };

  // Add specific item to cart
  const addItemToCart = (product: ProductWithVariantsForOrder, variant?: any) => {
    const itemId = variant ? `${product.id}-${variant.id}` : product.id;
    
    // Check if item already exists
    const existingIndex = selectedItems.findIndex(item => item.id === itemId);
    if (existingIndex >= 0) {
      // Increase quantity if already exists
      const updatedItems = [...selectedItems];
      updatedItems[existingIndex].quantity += 1;
      setSelectedItems(updatedItems);
      return;
    }

         const newItem: SelectedOrderItem = {
       id: itemId,
       productId: product.id,
       productName: product.name,
       productSku: product.sku,
       variantId: variant?.id,
       variantName: variant?.displayName,
       variantSku: variant?.sku,
       displayName: variant ? `${product.name} - ${variant.displayName}` : product.name,
       quantity: 1,
       unitPrice: variant ? variant.unitPrice : product.unitPrice,
       currentStock: variant ? variant.currentStock : (product.currentStock || 0),
       minimumStockLevel: variant ? variant.minimumStockLevel : (product.minimumStockLevel || 0),
       isVariant: !!variant,
     };

    setSelectedItems(prev => [...prev, newItem]);
  };

  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Update item quantity
  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setSelectedItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  // Update item price
  const updateItemPrice = (itemId: string, unitPrice: number) => {
    setSelectedItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, unitPrice } : item
      )
    );
  };

  // Calculate total
  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  };

     // Sync selected items with form
   React.useEffect(() => {
     const orderLines = selectedItems.map(item => ({
       productId: item.productId,
       productVariantId: item.variantId,
       quantity: item.quantity,
       unitPrice: item.unitPrice,
     }));
     form.setValue("orderLines", orderLines);
   }, [selectedItems, form]);

  // Reset when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setSelectedItems([]);
      setSearchQuery("");
      setExpandedProducts(new Set());
    }
  }, [open]);

  // Check for low stock products/variants
  const checkLowStockProducts = () => {
    const lowStock: any[] = [];
    selectedItems.forEach((item) => {
      if (item.quantity > item.currentStock) {
        lowStock.push(item);
      }
    });
    return lowStock;
  };

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true);

      // Check for low stock products if we have stock information
      const lowStock = checkLowStockProducts();
      if (lowStock.length > 0 && workCenters.length > 0) {
        setLowStockProducts(lowStock);
        setShowProductionPrompt(true);
        setIsSubmitting(false);
        return;
      }

      await submitOrder(values);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create customer order",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  }

  const submitOrder = async (values: FormValues) => {
    try {
      const result = await createCustomerOrder(values as CreateCustomerOrderInput);

      toast({
        title: "Success",
        description: "Customer order created successfully",
      });

      if (result.productionOrders && result.productionOrders.length > 0) {
        toast({
          title: "Production Orders Created",
          description: `${result.productionOrders.length} production orders were automatically generated`,
        });
      }

      setOpen(false);
      form.reset();
      setSelectedItems([]);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create customer order",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const createProductionOrders = async () => {
    if (!workCenters.length) {
      return submitOrder(form.getValues());
    }

    try {
      setIsSubmitting(true);
      const formValues = form.getValues();
      const orderResult = await createCustomerOrder(formValues as CreateCustomerOrderInput);

      toast({
        title: "Success",
        description: "Customer order created successfully",
      });

      const autoProductionOrderCount = orderResult.productionOrders?.length || 0;
      if (autoProductionOrderCount > 0) {
        toast({
          title: "Production Orders Created",
          description: `${autoProductionOrderCount} production orders were automatically generated`,
        });
      }

      setOpen(false);
      form.reset();
      setSelectedItems([]);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create customer order",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowProductionPrompt(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Create Order
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-semibold flex items-center gap-2 truncate">
                  <ShoppingCart className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">Create Customer Order</span>
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Select products and variants for your customer order. Configure quantities and pricing.
                </DialogDescription>
              </div>
              
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                {selectedItems.length > 0 && (
                  <Badge variant="secondary" className="text-sm px-2 py-1 hidden sm:flex">
                    {formatCurrency(calculateTotal())}
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                  className="hidden sm:flex"
                >
                  Cancel
                </Button>
                <Button
                  form="order-form"
                  type="submit"
                  disabled={isSubmitting || selectedItems.length === 0}
                  size="sm"
                  className="min-w-[120px]"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <span className="hidden sm:inline">
                    Create Order ({selectedItems.length})
                  </span>
                  <span className="sm:hidden">
                    Create ({selectedItems.length})
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="sm:hidden h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Order Details Form - Moved to top */}
          <div className="px-6 py-4 border-b flex-shrink-0">
            <Form {...form}>
              <form id="order-form" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <FormControl>
                          <CustomerCombobox
                            customers={customers.map((c) => ({
                              id: c.id,
                              name: c.name,
                              email: c.email,
                            }))}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select customer"
                            emptyText="No Customer found"
                            createNewPath="/admin/customers"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="orderDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Order Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                return date > today;
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requiredDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Required Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                return date < today;
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Order notes..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </div>

          {/* Two-Panel Layout */}
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 h-full">
              
              {/* Left Panel - Product Browser */}
              <div className="flex flex-col min-h-0">
                <Card className="flex-1 flex flex-col min-h-0">
                  <CardHeader className="pb-3 flex-shrink-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Products & Variants
                    </CardTitle>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search products and variants..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-0 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-2">
                        {filteredProducts.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-sm">
                              {searchQuery ? "No products found matching your search" : "No products available"}
                            </p>
                          </div>
                        ) : (
                          filteredProducts.map((product) => {
                            const hasVariants = product.hasVariants && product.variants && product.variants.length > 0;
                            const isExpanded = expandedProducts.has(product.id);
                            const productStockStatus = getStockStatus(product.currentStock || 0, product.minimumStockLevel || 0);

                            return (
                              <div key={product.id} className="border rounded-lg overflow-hidden">
                                {/* Product Header */}
                                <div className="p-3 bg-muted/30">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1">
                                      {hasVariants && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => toggleProductExpansion(product.id)}
                                          className="h-6 w-6 p-0"
                                        >
                                          {isExpanded ? (
                                            <ChevronDown className="h-3 w-3" />
                                          ) : (
                                            <ChevronRight className="h-3 w-3" />
                                          )}
                                        </Button>
                                      )}
                                      <Package className="w-4 h-4 text-blue-600" />
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm truncate">{product.name}</h4>
                                        <div className="text-xs text-muted-foreground">
                                          SKU: {product.sku} • Stock: {product.currentStock || 0}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                                                             <Badge variant={productStockStatus === "out" ? "destructive" : productStockStatus === "low" ? "secondary" : "outline"} className="text-xs">
                                         {formatCurrency(product.unitPrice)}
                                       </Badge>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => addEntireProduct(product)}
                                        className="text-xs px-2"
                                      >
                                        {hasVariants ? "Add All" : "Add"}
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                {/* Variants */}
                                {hasVariants && isExpanded && (
                                  <div className="border-t">
                                    {product.variants?.map((variant) => {
                                      const variantStockStatus = getStockStatus(variant.currentStock || 0, variant.minimumStockLevel || 0);
                                      
                                      return (
                                        <div key={variant.id} className="p-3 border-b last:border-b-0 hover:bg-muted/20">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 flex-1">
                                              <div className="w-6" /> {/* Indent for variants */}
                                              <Layers className="w-3 h-3 text-orange-600" />
                                              <div className="flex-1 min-w-0">
                                                <h5 className="text-sm truncate">{variant.displayName}</h5>
                                                <div className="text-xs text-muted-foreground">
                                                  SKU: {variant.sku} • Stock: {variant.currentStock || 0}
                                                </div>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                                                             <Badge variant={variantStockStatus === "out" ? "destructive" : variantStockStatus === "low" ? "secondary" : "outline"} className="text-xs">
                                                 {formatCurrency(variant.unitPrice)}
                                               </Badge>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => addItemToCart(product, variant)}
                                                className="text-xs px-2"
                                              >
                                                Add
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel - Shopping Cart */}
              <div className="flex flex-col min-h-0">
                <Card className="flex-1 flex flex-col min-h-0">
                  <CardHeader className="pb-3 flex-shrink-0">
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Order Items ({selectedItems.length})
                      </div>
                      {selectedItems.length > 0 && (
                        <Badge variant="secondary" className="text-sm px-2 py-1 sm:hidden">
                          {formatCurrency(calculateTotal())}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 p-0 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-3">
                        {selectedItems.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-sm">No items in order</p>
                            <p className="text-xs mt-1">Select products from the left panel to add them here</p>
                          </div>
                        ) : (
                          selectedItems.map((item) => {
                            const stockStatus = getStockStatus(item.currentStock, item.minimumStockLevel);
                            const lineTotal = item.quantity * item.unitPrice;
                            const isLowStock = item.quantity > item.currentStock;
                            
                            return (
                              <Card key={item.id}>
                                <CardContent className="p-3">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1 mb-1">
                                        {item.isVariant ? (
                                          <Layers className="w-3 h-3 text-orange-600 flex-shrink-0" />
                                        ) : (
                                          <Package className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                        )}
                                        <h4 className="font-medium text-sm truncate">{item.displayName}</h4>
                                      </div>
                                      <p className="text-xs text-muted-foreground truncate">
                                        SKU: {item.isVariant ? item.variantSku : item.productSku}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge variant={stockStatus === "out" ? "destructive" : stockStatus === "low" ? "secondary" : "outline"} className="text-xs">
                                          {item.currentStock} available
                                        </Badge>
                                        {isLowStock && (
                                          <Badge variant="destructive" className="text-xs">
                                            Insufficient Stock
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removeFromCart(item.id)}
                                      className="h-6 w-6 p-0 flex-shrink-0"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div>
                                      <Label className="text-xs">Quantity</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                        className="text-right text-sm h-7"
                                      />
                                    </div>
                                    
                                    <div>
                                      <Label className="text-xs">Unit Price</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.unitPrice}
                                        onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                                        className="text-right text-sm h-7"
                                      />
                                    </div>
                                  </div>

                                  <Separator className="my-2" />

                                  <div className="flex justify-between text-sm font-medium">
                                    <span>Line Total:</span>
                                    <span>{formatCurrency(lineTotal)}</span>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                  {selectedItems.length > 0 && (
                    <CardFooter className="border-t">
                      <div className="w-full">
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} • 
                            Total Qty: {selectedItems.reduce((sum, item) => sum + item.quantity, 0)}
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Order Total</div>
                            <div className="text-xl font-bold">
                              {formatCurrency(calculateTotal())}
                            </div>
                          </div>
                        </div>
                        
                        {/* Stock Warnings */}
                        {selectedItems.some(item => item.quantity > item.currentStock) && (
                          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-amber-600" />
                              <p className="text-xs text-amber-800">
                                Some items have insufficient inventory. Production orders may be needed.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardFooter>
                  )}
                </Card>
              </div>
            </div>
          </div>

          {/* Mobile-only bottom action bar */}
          <div className="sm:hidden border-t p-4 flex-shrink-0">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                form="order-form"
                type="submit"
                disabled={isSubmitting || selectedItems.length === 0}
                className="flex-1"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create ({selectedItems.length})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Production Order Prompt Dialog */}
      {showProductionPrompt && (
        <Dialog
          open={showProductionPrompt}
          onOpenChange={setShowProductionPrompt}
        >
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle className="text-xl">Low Stock Warning</DialogTitle>
              <DialogDescription>
                Some products or variants in this order have insufficient inventory. Would
                you like to create production orders automatically?
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <h3 className="text-sm font-medium mb-2">
                Items with low stock:
              </h3>
              <div className="space-y-2 mt-4">
                {lowStockProducts.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div>
                      <p className="font-medium">{item.displayName}</p>
                      <p className="text-sm text-muted-foreground">
                        SKU: {item.isVariant ? item.variantSku : item.productSku}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {item.currentStock} available
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Needed: {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => submitOrder(form.getValues())}
                disabled={isSubmitting}
                className="flex-1"
              >
                Create Order Only
              </Button>
              <Button
                onClick={createProductionOrders}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Creating..." : "Create Order + Production Orders"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
