# Implementing the Adapter Pattern for Type Compatibility in React Applications

## Problem Statement

In modern React applications with TypeScript, you often encounter scenarios where different components expect different data structures, especially when:

1. Working with ORM libraries like Prisma that use custom types (like `Decimal`)
2. Dealing with components that have different expectations for object properties
3. Converting between backend data formats and frontend display formats
4. Handling optional fields that may not be present in all data representations

Without a proper strategy, this leads to:
- Type errors
- Inconsistent data handling
- Repeated conversion logic across components
- Difficulty maintaining the codebase when data structures change

## Solution: The Adapter Pattern

The Adapter Pattern is a software design pattern that allows objects with incompatible interfaces to work together. In our React application, we implemented this pattern by:

1. Creating dedicated adapter functions to convert between different data representations
2. Centralizing all conversion logic in a single place
3. Ensuring type safety throughout the application
4. Providing a clean separation of concerns

## Implementation Steps

### 1. Define a Common Interface

First, we defined a common interface that describes the structure for our table component:

```typescript
export interface ExtendedProductForTable {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;  // Note: as a number, not Decimal
  description: string | null;
  status: Status;
  currentStock: number;
  // Other properties...
  [key: string]: any;  // Allow for additional properties
}
```

### 2. Create Adapter Functions

We created three adapter functions to handle different conversions:

#### From Prisma Model to Table Format

```typescript
export function adaptProductForTable(product: Product & {
  productionOrders?: Array<...>;
}): ExtendedProductForTable {
  // Convert all Decimal values to regular numbers
  const converted = convertDecimalsToNumbers(product);
  
  return {
    id: converted.id,
    name: converted.name,
    // Convert and handle all properties
    sellingPrice: Number(converted.sellingPrice),
    // Handle optional properties with default values
    description: converted.description || null,
    // Add properties with sensible defaults
    productionOrders: converted.productionOrders || [],
    expectedStock: converted.expectedStock || 0,
    committedStock: converted.committedStock || 0,
  };
}
```

#### From Table Format to Prisma Model

```typescript
export function adaptTableProductForAPI(tableProduct: ExtendedProductForTable): Product {
  return {
    id: tableProduct.id,
    name: tableProduct.name,
    // Convert number properties to Decimal
    unitCost: new Decimal(tableProduct.unitCost),
    sellingPrice: new Decimal(tableProduct.sellingPrice),
    // Handle other properties...
  };
}
```

#### From Table Format to Detail View Format

```typescript
export function adaptTableProductForDetails(
  tableProduct: ExtendedProductForTable
): ProductWithNumberValues {
  // Use type casting when structures are compatible
  return tableProduct as unknown as ProductWithNumberValues;
}
```

### 3. Use Adapters in Components

#### In Data Table Component

We convert the incoming data to our table format:

```typescript
// Convert products to the table format using our adapter function
const adaptedData: ExtendedProductForTable[] = data.map(product => 
  adaptProductForTable(product)
);

// Then pass to the table component
const table = useReactTable({
  data: adaptedData,
  columns,
  // Other properties...
});
```

#### In Column Definitions

Before passing data to other components like modals or dialogs, we convert it back to the expected format:

```typescript
{
  id: "actions",
  cell: ({ row }) => {
    const tableProduct = row.original;
    
    // Convert table product to Prisma format for edit/delete dialogs
    const productForAPI = adaptTableProductForAPI(tableProduct);

    return (
      <DropdownMenu>
        {/* ... */}
        <EditProductDialog
          product={productForAPI}  // Now compatible with dialog props
          categories={categories}
          onSuccess={onSuccess}
          // ...
        />
      </DropdownMenu>
    );
  },
},
```

## Key Benefits Realized

1. **Type Safety**: Eliminated type errors between components with different expectations
2. **Centralized Conversion Logic**: All conversions happen in one place
3. **Simplified Components**: Components only need to focus on their own responsibilities
4. **Better Maintainability**: When data structures change, only the adapters need updating
5. **Consistent Handling**: All data conversions follow the same pattern
6. **Explicit Default Values**: Default values for optional properties are explicitly defined
7. **Cleaner Codebase**: Reduced duplication of conversion logic

## Best Practices

1. **Keep Adapters Simple**: Each adapter should focus on a single conversion
2. **Be Explicit About Types**: Clearly define both input and output types
3. **Handle Edge Cases**: Provide defaults for missing properties
4. **Use Descriptive Names**: Name adapters based on their source and destination formats
5. **Document Expected Behavior**: Add comments to explain any non-obvious conversions
6. **Consider Performance**: For large datasets, be mindful of conversion overhead
7. **Test Conversion Logic**: Ensure adapters handle all edge cases correctly
8. **Maintain Bidirectional Conversion**: Ensure round-trip conversions maintain data integrity

## Real-World Example

In our application, we used the adapter pattern to solve the compatibility issues between:

1. **Prisma Products** (with Decimal types and certain required fields)
2. **Table Display Format** (with number types and row-specific properties)
3. **Edit/Delete Dialogs** (expecting Prisma Product format)
4. **Production Order Dialog** (expecting ProductWithNumberValues format)

The adapters ensured smooth data flow between these components without requiring changes to the individual components themselves.

## Conclusion

The Adapter Pattern is a powerful tool for managing type compatibility in TypeScript React applications. By implementing it properly, we've created a more maintainable, type-safe codebase that can easily adapt to changing data structures and component requirements.