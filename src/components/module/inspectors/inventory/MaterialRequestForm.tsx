"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Plus,
  Trash,
  Loader2,
  FileText,
} from "lucide-react";
import {
  requestMaterials,
  getWorkerWorkCenters,
  getInventoryItemsForRequest,
} from "@/lib/actions/worker/inventory";
import { InventoryItem, RequestPriority } from "@/types/inspector/inventory";
import { toast } from "@/hooks/use-toast";
import MaterialRequestPdf from "./MaterialRequestPdf";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Form validation schema
const FormSchema = z.object({
  workCenterId: z.string({
    required_error: "Please select a work center",
  }),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"], {
    required_error: "Please select a priority level",
  }),
  requiredDate: z.date({
    required_error: "Please select a required date",
  }),
  notes: z.string().optional(),
  productionOrderId: z.string().optional(),
  items: z
    .array(
      z.object({
        inventoryItemId: z.string(),
        inventoryItemName: z.string(),
        unitOfMeasure: z.string(),
        quantityRequested: z.number().min(1, "Quantity must be at least 1"),
        notes: z.string().optional(),
      })
    )
    .min(1, "Please add at least one item"),
});

type FormValues = z.infer<typeof FormSchema>;

export default function MaterialRequestForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [requestData, setRequestData] = useState<{
    workCenterId: string;
    requiredDate: Date;
    priority: RequestPriority;
    notes?: string;
    productionOrderId?: string;
    items: any[];
  } | null>(null);
  const [workCenters, setWorkCenters] = useState<
    Array<{ id: string; name: string; description?: string }>
  >([]);
  const [availableItems, setAvailableItems] = useState<
    Array<{
      id: string;
      name: string;
      sku: string;
      unitOfMeasure: string;
      currentStock: number;
      stockLevel: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState("");
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemNotes, setItemNotes] = useState("");

  // Define a ref to track if we're generating a PDF
  const generatePdfRef = useRef(false);

  // Fetch data on component mount
  useEffect(() => {
    async function loadData() {
      try {
        const [workCenterData, inventoryData] = await Promise.all([
          getWorkerWorkCenters(),
          getInventoryItemsForRequest(),
        ]);

        setWorkCenters(workCenterData);
        setAvailableItems(inventoryData);
      } catch (error) {
        console.error("Error loading form data:", error);
        toast({
          title: "Error",
          description: "Failed to load form data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      priority: "MEDIUM",
      requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      notes: "",
      items: [],
    },
  });

  // Get form values
  const items = form.watch("items");

  // Handle item addition
  const handleAddItem = () => {
    if (!selectedItem) return;

    const item = availableItems.find((i) => i.id === selectedItem);
    if (!item) return;

    const newItem = {
      inventoryItemId: item.id,
      inventoryItemName: item.name,
      unitOfMeasure: item.unitOfMeasure,
      quantityRequested: itemQuantity,
      notes: itemNotes,
    };

    form.setValue("items", [...items, newItem]);

    // Reset selection
    setSelectedItem("");
    setItemQuantity(1);
    setItemNotes("");
  };

  // Handle item removal
  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    form.setValue("items", newItems);
  };

  // Submit form handler for both normal submit and PDF generation
  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      const result = await requestMaterials(
        data.workCenterId,
        data.requiredDate,
        data.priority as RequestPriority,
        data.notes || "",
        data.items.map((item) => ({
          inventoryItemId: item.inventoryItemId,
          quantityRequested: item.quantityRequested,
          notes: item.notes || "",
        })),
        data.productionOrderId
      );

      toast({
        title: "Material request submitted",
        description: "Your material request has been submitted successfully",
      });

      // Store the request data for PDF generation if needed
      setRequestData({
        workCenterId: data.workCenterId,
        requiredDate: data.requiredDate,
        priority: data.priority as RequestPriority,
        notes: data.notes,
        productionOrderId: data.productionOrderId,
        items: data.items.map((item) => ({
          id: item.inventoryItemId,
          materialRequestId: result.id,
          inventoryItemId: item.inventoryItemId,
          inventoryItemName: item.inventoryItemName,
          quantityRequested: item.quantityRequested,
          unit: item.unitOfMeasure,
          notes: item.notes || "",
          status: "PENDING",
        })),
      });

      setRequestSubmitted(true);

      // If PDF download is not requested, navigate to inventory page after a delay
      if (!generatePdfRef.current) {
        setTimeout(() => {
          router.push("/worker/inventory");
        }, 3000);
      }
    } catch (error) {
      console.error("Error submitting material request:", error);
      toast({
        title: "Error",
        description: "Failed to submit material request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle submit with PDF generation
  const handleSubmitWithPdf = () => {
    generatePdfRef.current = true;
    form.handleSubmit(onSubmit)();
  };

  // Handle normal submit
  const handleSubmit = () => {
    generatePdfRef.current = false;
    form.handleSubmit(onSubmit)();
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading form data...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>
              Enter the details for your material request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="workCenterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Center</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a work center" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workCenters.map((wc) => (
                          <SelectItem key={wc.id} value={wc.id}>
                            {wc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The work center needing these materials
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How urgently the materials are needed
                    </FormDescription>
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
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
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
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When the materials are needed by
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productionOrderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Production Order (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter production order reference"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Related production order, if applicable
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional information..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Items</CardTitle>
            <CardDescription>
              Add the materials needed for your work center
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <FormLabel>Material</FormLabel>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a material" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <FormLabel>Quantity</FormLabel>
                <Input
                  type="number"
                  min={1}
                  value={itemQuantity}
                  onChange={(e) =>
                    setItemQuantity(parseInt(e.target.value) || 1)
                  }
                  placeholder="Quantity"
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedItem || itemQuantity < 1}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </div>

            <FormField
              control={form.control}
              name="items"
              render={() => (
                <FormItem>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Unit</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="text-center h-24 text-muted-foreground"
                            >
                              No items added yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.inventoryItemName}</TableCell>
                              <TableCell className="text-right">
                                {item.quantityRequested}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.unitOfMeasure}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveItem(index)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            {requestSubmitted && requestData ? (
              <MaterialRequestPdf
                workCenterId={requestData.workCenterId}
                requiredDate={requestData.requiredDate}
                priority={requestData.priority}
                notes={requestData.notes}
                productionOrderId={requestData.productionOrderId}
                items={requestData.items}
              />
            ) : (
              <Button
                type="button"
                onClick={handleSubmitWithPdf}
                disabled={isSubmitting || !form.formState.isValid}
                size="lg"
                variant="outline"
              >
                <FileText className="mr-2 h-4 w-4" />
                Submit & Download PDF
              </Button>
            )}

            <Button
              type="button"
              onClick={handleSubmit}
              size="lg"
              disabled={isSubmitting || !form.formState.isValid}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit Request
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
