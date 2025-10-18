"use client";

import { UseFormReturn } from "react-hook-form";
import {
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

interface VariantStepProps {
  form: UseFormReturn<any>;
  selectedProduct: any;
}

export function VariantStep({ form, selectedProduct }: VariantStepProps) {
  if (!selectedProduct?.hasVariants || !selectedProduct?.variants) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">This product does not have variants</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="productVariantId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Select Variant *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a variant" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {selectedProduct.variants.map((variant: any) => (
                  <SelectItem key={variant.id} value={variant.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{variant.displayName}</span>
                      <span className="text-xs text-muted-foreground">
                        {variant.sizeName} - {variant.colorName} ({variant.sku})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Select the specific variant to manufacture
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {form.watch("productVariantId") && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Variant Selected:</strong>{" "}
            {
              selectedProduct.variants.find(
                (v: any) => v.id === form.watch("productVariantId")
              )?.displayName
            }
          </p>
        </div>
      )}
    </div>
  );
}
