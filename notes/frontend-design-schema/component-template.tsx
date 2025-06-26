"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Search, Package, ShoppingCart, X, Plus, Trash2, Download, Filter, MoreHorizontal, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Define your interfaces
interface Item {
  id: string
  name: string
  description: string
  // Add other properties as needed
}

interface SelectedItem extends Item {
  quantity: number
  // Add other properties as needed for selected items
}

interface ComponentTemplateProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => Promise<void>
  // Add other props as needed
}

export function ComponentTemplate({
  open,
  onOpenChange,
  onSuccess,
}: ComponentTemplateProps) {
  // State management
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [items, setItems] = useState<Item[]>([])
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const { toast } = useToast()

  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      fetchItems()
      // Reset selections
      setSelectedItems([])
      setSearchQuery("")
    }
  }, [open])

  // Fetch items from API
  const fetchItems = async () => {
    try {
      setIsLoading(true)
      // Replace with your API call
      const response = await fetch('/api/items')
      const data = await response.json()
      setItems(data)
    } catch (error) {
      console.error("Failed to fetch items:", error)
      toast({
        title: "Error",
        description: "Failed to fetch items",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter items based on search
  const filteredItems = items.filter((item) => {
    return searchQuery === "" || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Add item to selection
  const handleAddItem = (item: Item) => {
    // Check if already selected
    if (selectedItems.some(selected => selected.id === item.id)) {
      return
    }
    
    const newSelectedItem: SelectedItem = {
      ...item,
      quantity: 1,
    }
    setSelectedItems(prev => [...prev, newSelectedItem])
  }

  // Remove item from selection
  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId))
  }

  // Update quantity for selected item
  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId)
      return
    }
    
    setSelectedItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity }
          : item
      )
    )
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select at least one item",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      
      // Replace with your API call
      // await submitItems(selectedItems)
      
      await onSuccess()
      onOpenChange(false)
      
      toast({
        title: "Success",
        description: `Successfully processed ${selectedItems.length} item(s)`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process items",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0 bg-white/90 dark:bg-slate-800/90">
        {/* Dialog Header - Following the design schema */}
        <DialogHeader className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-700/80 flex-shrink-0 bg-white/90 dark:bg-slate-800/90">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold flex items-center gap-2 truncate">
                <ShoppingCart className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">Component Template</span>
              </DialogTitle>
              <DialogDescription className="mt-1">
                This is a template component following the design schema
              </DialogDescription>
            </div>
            
            {/* Action Buttons in Header */}
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="hidden sm:flex"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isLoading || selectedItems.length === 0}
                size="sm"
                className="min-w-[100px]"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <span className="hidden sm:inline">
                  Submit {selectedItems.length > 0 && `(${selectedItems.length})`}
                </span>
                <span className="sm:hidden">
                  Submit {selectedItems.length > 0 && `(${selectedItems.length})`}
                </span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="sm:hidden h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Two-Panel Layout - Following the design schema */}
        <div className="flex-1 overflow-hidden bg-[#FAFBFC] dark:bg-slate-700/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 h-full">
            
            {/* Left Panel - Browse/Search Items */}
            <div className="flex flex-col min-h-0">
              <Card className="flex-1 flex flex-col min-h-0 bg-[#F2F3F4] border border-slate-200/60 dark:bg-slate-900/50 dark:border-slate-700/60">
                <CardHeader className="pb-3 flex-shrink-0 bg-[#F8F9FA] dark:bg-slate-800/50 border-b border-slate-100/80 dark:border-slate-800/60">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Available Items
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white/80 dark:bg-slate-700/80"
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-2">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin" />
                          <span className="ml-2">Loading items...</span>
                        </div>
                      ) : filteredItems.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-sm">
                            {searchQuery ? "No items found matching your search" : "No items available"}
                          </p>
                        </div>
                      ) : (
                        filteredItems.map((item) => (
                          <div
                            key={item.id}
                            className="bg-[#F8F9FA] border border-slate-100/80 dark:bg-slate-800/50 dark:border-slate-800/60 rounded-lg p-3 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
                            onClick={() => handleAddItem(item)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{item.name}</h4>
                                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                              </div>
                              <Button size="sm" variant="outline" className="ml-2 flex-shrink-0">
                                <Plus className="w-3 h-3 mr-1" />
                                <span className="hidden sm:inline">Add</span>
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Selected Items */}
            <div className="flex flex-col min-h-0">
              <Card className="flex-1 flex flex-col min-h-0 bg-[#F2F3F4] border border-slate-200/60 dark:bg-slate-900/50 dark:border-slate-700/60">
                <CardHeader className="pb-3 flex-shrink-0 bg-[#F8F9FA] dark:bg-slate-800/50 border-b border-slate-100/80 dark:border-slate-800/60">
                  <CardTitle className="text-base flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      Selected Items ({selectedItems.length})
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-3">
                      {selectedItems.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-sm">No items selected</p>
                          <p className="text-xs mt-1">Select items from the left panel</p>
                        </div>
                      ) : (
                        selectedItems.map((item) => (
                          <Card key={item.id} className="bg-[#FAFBFC] border border-slate-200/50 dark:bg-slate-700/50 dark:border-slate-600/50">
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm mb-1 truncate">{item.name}</h4>
                                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="h-6 w-6 p-0 flex-shrink-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-1 gap-2 mb-3">
                                <div>
                                  <Label className="text-xs">Quantity</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                                    className="text-right text-sm h-7"
                                  />
                                </div>
                              </div>

                              <Separator className="my-2" />

                              <div className="flex justify-between text-sm font-medium">
                                <span>Total:</span>
                                <span>{item.quantity}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Mobile-only bottom action bar - Following the design schema */}
        <div className="sm:hidden border-t border-slate-200/80 dark:border-slate-700/80 p-4 flex-shrink-0 bg-white/90 dark:bg-slate-800/90">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading || selectedItems.length === 0}
              className="flex-1"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit {selectedItems.length > 0 && `(${selectedItems.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ==============================================
// TABLE PAGE LAYOUT EXAMPLES
// ==============================================

// Standard Table Page Layout
function StandardTablePage() {
  return (
    <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-card border rounded-lg">
        {/* Table Toolbar */}
        <div className="flex items-center justify-between gap-4 flex-wrap p-6 pb-4 border-b bg-card">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search products..." className="pl-10" />
            </div>
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="p-4 text-left font-medium">Product</th>
                <th className="p-4 text-left font-medium">Category</th>
                <th className="p-4 text-left font-medium">Stock</th>
                <th className="p-4 text-left font-medium">Price</th>
                <th className="p-4 text-left font-medium">Status</th>
                <th className="p-4 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-4 align-middle">Product Name</td>
                <td className="p-4 align-middle">Category</td>
                <td className="p-4 align-middle">
                  <Badge variant="outline">In Stock</Badge>
                </td>
                <td className="p-4 align-middle">$99.99</td>
                <td className="p-4 align-middle">
                  <Badge variant="default" className="bg-green-500 text-white">Active</Badge>
                </td>
                <td className="p-4 align-middle">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t bg-card">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing 1 to 10 of 100 results
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Table Page with Summary Cards
function TablePageWithSummary() {
  return (
    <div className="flex flex-col gap-6 p-8 bg-background min-h-screen">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor stock levels and inventory health</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Material
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <Package className="h-8 w-8 text-blue-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground truncate">Total Items</p>
              <p className="text-2xl font-bold text-foreground mt-1 sm:text-3xl">1,234</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">+12% from last month</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground truncate">Low Stock</p>
              <p className="text-2xl font-bold text-foreground mt-1 sm:text-3xl">23</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">Requires attention</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-card border rounded-lg">
        {/* Table content similar to StandardTablePage */}
      </div>
    </div>
  );
}

// Table Page with Sidebar Filters
function TablePageWithSidebar() {
  return (
    <div className="flex gap-6 p-8 bg-background min-h-screen">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 bg-card border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Filters</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Category</Label>
            <Select>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium">Status</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="active" />
                <Label htmlFor="active">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="inactive" />
                <Label htmlFor="inactive">Inactive</Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Advanced Product Search</h1>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        <div className="bg-card border rounded-lg">
          {/* Table content */}
        </div>
      </div>
    </div>
  );
} 