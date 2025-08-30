# Global Reusable Data Table Components

A comprehensive, reusable data table system built on top of TanStack Table for consistent usage across all admin pages in the XGEN MRP system.

## 📁 Structure

```
src/components/global/table/
├── README.md                          # This documentation
├── index.ts                          # Main exports
├── types.ts                          # TypeScript interfaces
├── data-table.tsx                    # Main table component
├── data-table-toolbar.tsx            # Search and filtering toolbar
├── data-table-pagination.tsx         # Pagination controls
├── data-table-view-options.tsx       # Column visibility toggle
├── data-table-faceted-filter.tsx     # Advanced filtering
├── data-table-row-actions.tsx        # Row action dropdown
├── table-utils.ts                    # Utility functions and configs
└── column-helpers.tsx                # Column creation helpers
```

## 🚀 Quick Start

### Basic Usage

```tsx
import { DataTable } from "@/components/global/table";
import { ColumnDef } from "@tanstack/react-table";

// Define your columns
const columns: ColumnDef<YourDataType>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "status",
    header: "Status", 
  },
];

// Use in your page
export default function YourPage() {
  const [data, setData] = useState([]);
  
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      searchPlaceholder="Filter records..."
    />
  );
}
```

### Advanced Usage with Predefined Configs

```tsx
import { DataTable, getTableConfig } from "@/components/global/table";

export default function MaterialsPage() {
  const tableConfig = getTableConfig("materials");
  
  return (
    <DataTable
      columns={materialColumns}
      data={materials}
      {...tableConfig}
    />
  );
}
```

## 🔧 Features

### ✅ Core Features
- **Sorting** - Click column headers to sort
- **Filtering** - Search and advanced filters
- **Pagination** - Configurable page sizes
- **Column Visibility** - Show/hide columns
- **Row Selection** - Select individual or all rows
- **Row Actions** - Dropdown menu for row operations
- **Responsive Design** - Mobile-friendly layout

### ✅ Built-in Configurations
Pre-configured table settings for common page types:
- `materials` - Materials management
- `products` - Product catalog
- `production` - Production orders
- `customers` - Customer management
- `suppliers` - Supplier management
- `users` - User administration

## 📋 Component Props

### DataTable Props

```tsx
interface DataTableProps<TData, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];     // Table columns definition
  data: TData[];                           // Table data
  searchKey?: string;                      // Column key for search (default: "name")
  searchPlaceholder?: string;              // Search input placeholder
  enableSelection?: boolean;               // Enable row selection (default: false)
  enablePagination?: boolean;              // Enable pagination (default: true)
  enableFiltering?: boolean;               // Enable filtering (default: true)
  enableSorting?: boolean;                 // Enable sorting (default: true)
  enableColumnVisibility?: boolean;        // Enable column toggle (default: true)
  pageSize?: number;                       // Default page size (default: 10)
  className?: string;                      // Additional CSS classes
  emptyMessage?: string;                   // Empty state message
}
```

## 🏗️ Column Helpers

Use the provided column helpers for consistent column creation:

### Status Column
```tsx
import { createStatusColumn } from "@/components/global/table";

const statusColumn = createStatusColumn("status", "Status");
```

### Currency Column
```tsx
import { createCurrencyColumn } from "@/components/global/table";

const priceColumn = createCurrencyColumn("price", "Price", "PHP");
```

### Date Column
```tsx
import { createDateColumn } from "@/components/global/table";

const createdAtColumn = createDateColumn("createdAt", "Created", true); // with time
```

### Text with Subtitle
```tsx
import { createTextColumn } from "@/components/global/table";

const nameColumn = createTextColumn("name", "Material", "sku");
```

### Actions Column
```tsx
import { createActionsColumn } from "@/components/global/table";

const actionsColumn = createActionsColumn([
  {
    label: "Edit",
    icon: Pencil,
    onClick: (row) => editItem(row.id),
  },
  {
    label: "Delete",
    icon: Trash,
    onClick: (row) => deleteItem(row.id),
    variant: "destructive",
  },
]);
```

### Selection Column
```tsx
import { createSelectionColumn } from "@/components/global/table";

const selectionColumn = createSelectionColumn();
```

## 📄 Page Implementation Examples

### Materials Page Example

```tsx
// src/app/admin/(protected)/materials/page.tsx
import { DataTable, createTextColumn, createStatusColumn, createActionsColumn } from "@/components/global/table";
import { Material } from "@/types/admin/materials";

const columns = [
  createTextColumn<Material>("name", "Material", "sku"),
  createSimpleTextColumn<Material>("type.name", "Type"),
  createCurrencyColumn<Material>("costPerUnit", "Cost/Unit"),
  createNumberColumn<Material>("currentStock", "Stock"),
  createStatusColumn<Material>("status"),
  createActionsColumn<Material>([
    {
      label: "Edit",
      icon: Pencil,
      onClick: (material) => openEditDialog(material),
    }
  ]),
];

export default async function MaterialsPage() {
  const materials = await getAllMaterials();
  
  return (
    <SectionCard heading="All Materials">
      <DataTable
        columns={columns}
        data={materials}
        searchKey="name"
        searchPlaceholder="Filter materials..."
        enableSelection={true}
      />
    </SectionCard>
  );
}
```

### Production Orders Example

```tsx
// src/app/admin/(protected)/production/page.tsx
import { DataTable, getTableConfig, createProgressColumn } from "@/components/global/table";

const columns = [
  createTextColumn("productName", "Product", "productSku"),
  createNumberColumn("quantity", "Quantity"),
  createDateColumn("dueDate", "Due Date"),
  createStatusColumn("status"),
  createProgressColumn("progress"),
  createActionsColumn(productionActions),
];

export default async function ProductionPage() {
  const orders = await getProductionOrders();
  const config = getTableConfig("production");
  
  return (
    <SectionCard heading="All Production Orders">
      <DataTable
        columns={columns}
        data={orders}
        {...config}
      />
    </SectionCard>
  );
}
```

## 🎨 Customization

### Custom Filter Options

```tsx
const customFilterOptions = [
  {
    column: "category",
    title: "Category",
    options: [
      { label: "Electronics", value: "electronics" },
      { label: "Clothing", value: "clothing" },
    ],
  },
];

<DataTable
  columns={columns}
  data={data}
  filterOptions={customFilterOptions}
/>
```

### Custom Toolbar Actions

```tsx
<DataTable
  columns={columns}
  data={data}
  customToolbarActions={
    <Button onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      Export
    </Button>
  }
/>
```

## 🔄 Migration Guide

### From Existing Page-Specific Tables

1. **Replace imports:**
```tsx
// Old
import { DataTable } from "@/components/module/admin/materials/data-table";

// New
import { DataTable } from "@/components/global/table";
```

2. **Update column definitions using helpers:**
```tsx
// Old - manual column definition
{
  accessorKey: "status",
  header: "Status",
  cell: ({ row }) => (
    <Badge variant={...}>
      {row.getValue("status")}
    </Badge>
  ),
}

// New - using helper
createStatusColumn("status", "Status")
```

3. **Simplify table configuration:**
```tsx
// Old - multiple props
<DataTable
  data={data}
  columns={columns}
  enableRowSelection={true}
  enableFiltering={true}
  // ... many props
/>

// New - using predefined config
<DataTable
  data={data}
  columns={columns}
  {...getTableConfig("materials")}
/>
```

## 🛠️ Development

### Adding New Predefined Configs

Edit `table-utils.ts` to add new table configurations:

```tsx
export const tableConfigs = {
  // ... existing configs
  yourNewPage: {
    searchKey: "name",
    searchPlaceholder: "Filter items...",
    emptyMessage: "No items found.",
    enableSelection: true,
    filterOptions: [
      // your filter options
    ],
  },
} as const;
```

### Creating Custom Column Helpers

Add new column helpers in `column-helpers.tsx`:

```tsx
export function createYourCustomColumn<T>(
  accessorKey: string,
  title: string,
  customProp?: string
): ColumnDef<T> {
  return {
    accessorKey,
    header: createSortableHeader(title),
    cell: ({ row }) => {
      // Your custom cell logic
      return <YourCustomComponent />;
    },
  };
}
```

## 📚 Best Practices

1. **Use predefined configs** when possible for consistency
2. **Leverage column helpers** instead of manual column definitions
3. **Keep search keys consistent** (usually "name" or "email")
4. **Enable selection sparingly** - only when bulk actions are needed
5. **Provide meaningful empty messages** for better UX
6. **Use semantic column names** that match your data structure

## 🐛 Troubleshooting

### Common Issues

**Table not rendering:**
- Check that `columns` and `data` props are provided
- Ensure column `accessorKey` matches your data structure

**Filtering not working:**
- Verify `searchKey` matches an actual column accessor
- Check that `enableFiltering` is not set to false

**Actions not appearing:**
- Ensure actions array is not empty
- Check that action callbacks are properly defined

**Styling issues:**
- Import required CSS classes
- Check Tailwind CSS is properly configured

---

## 📞 Support

For questions or issues with the global table components, please:

1. Check this README first
2. Look at existing page implementations
3. Review the component source code
4. Ask the development team

---

**Happy coding! 🚀**
