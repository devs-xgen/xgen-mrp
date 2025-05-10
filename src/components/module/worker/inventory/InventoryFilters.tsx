"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  LocationType,
  MaterialType,
  StockLevel,
} from "@/types/worker/inventory";
import { X, Search, Filter } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";

const filterFormSchema = z.object({
  search: z.string().optional(),
  stockLevel: z
    .enum(["all", "normal", "low", "critical", "outOfStock"])
    .optional(),
  materialType: z.string().optional(),
  location: z.string().optional(),
});

type FilterFormValues = z.infer<typeof filterFormSchema>;

interface InventoryFiltersProps {
  materialTypes: MaterialType[];
  locations: LocationType[];
  defaultValues?: {
    search?: string;
    stockLevel?: StockLevel | "all";
    materialType?: string;
    location?: string;
  };
}

export function InventoryFilters({
  materialTypes,
  locations,
  defaultValues = {},
}: InventoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: {
      search: defaultValues.search || "",
      stockLevel: (defaultValues.stockLevel || "all") as any,
      materialType: defaultValues.materialType || "",
      location: defaultValues.location || "",
    },
  });

  function onSubmit(data: FilterFormValues) {
    const params = new URLSearchParams(searchParams.toString());

    // Set search and filter parameters
    if (data.search) params.set("search", data.search);
    else params.delete("search");

    if (data.stockLevel && data.stockLevel !== "all")
      params.set("stockLevel", data.stockLevel);
    else params.delete("stockLevel");

    if (data.materialType) params.set("materialType", data.materialType);
    else params.delete("materialType");

    if (data.location) params.set("location", data.location);
    else params.delete("location");

    // Reset pagination
    params.set("page", "1");

    // Update URL
    router.push(`?${params.toString()}`);
    setIsFiltersOpen(false);
  }

  function resetFilters() {
    form.reset({
      search: "",
      stockLevel: "all",
      materialType: "",
      location: "",
    });

    const params = new URLSearchParams();
    params.set("page", "1");
    router.push(`?${params.toString()}`);
    setIsFiltersOpen(false);
  }

  // Count active filters (excluding search)
  const activeFilterCount = [
    form.watch("stockLevel") !== "all" &&
      form.watch("stockLevel") !== undefined,
    !!form.watch("materialType"),
    !!form.watch("location"),
  ].filter(Boolean).length;

  return (
    <div className="mb-4 flex flex-col space-y-4 md:flex-row md:items-end md:justify-between md:space-y-0">
      <Form {...form}>
        <div className="flex w-full flex-1 space-x-2">
          <FormField
            control={form.control}
            name="search"
            render={({ field }) => (
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input
                    placeholder="Search inventory by name or SKU..."
                    className="pl-8"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      // Auto-submit after a short delay
                      setTimeout(() => form.handleSubmit(onSubmit)(), 500);
                    }}
                  />
                </FormControl>
                {field.value && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1.5 h-6 w-6 rounded-full p-0"
                    onClick={() => {
                      field.onChange("");
                      form.handleSubmit(onSubmit)();
                    }}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear search</span>
                  </Button>
                )}
              </div>
            )}
          />

          <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-1 whitespace-nowrap"
              >
                <Filter className="h-4 w-4" />
                <span className="ml-2 hidden md:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Inventory Filters</SheetTitle>
                <SheetDescription>
                  Filter inventory items by various criteria
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="stockLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Level</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All stock levels" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All stock levels</SelectItem>
                          <SelectItem value="normal">Normal stock</SelectItem>
                          <SelectItem value="low">Low stock</SelectItem>
                          <SelectItem value="critical">
                            Critical stock
                          </SelectItem>
                          <SelectItem value="outOfStock">
                            Out of stock
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="materialType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All material types" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">All material types</SelectItem>
                          {materialTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All locations" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">All locations</SelectItem>
                          {locations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <SheetFooter className="mt-6 flex justify-between sm:justify-between">
                <Button type="button" variant="outline" onClick={resetFilters}>
                  Reset Filters
                </Button>
                <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
                  Apply Filters
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </Form>
    </div>
  );
}
