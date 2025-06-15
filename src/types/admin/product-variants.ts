import { Material, Product } from "@prisma/client";

// =============================================
// PRODUCT VARIANT TYPES
// =============================================

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;

  // Variant Attributes
  sizeName?: string | null;
  sizeCode?: string | null;
  colorName?: string | null;
  colorCode?: string | null;
  styleName?: string | null;
  materialName?: string | null;

  // Pricing and Stock
  unitCost: number;
  sellingPrice: number;
  currentStock: number;
  minimumStockLevel: number;
  expectedStock: number;
  committedStock: number;

  // Display and Organization
  displayName: string;
  isActive: boolean;
  sortOrder: number;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  modifiedBy?: string | null;
}

export interface ProductVariantBOM {
  id: string;
  productVariantId: string;
  materialId: string;
  quantityNeeded: number;
  wastePercentage: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  modifiedBy?: string | null;
}

// Enhanced types with relations
export interface ProductVariantWithBOM extends ProductVariant {
  boms: (ProductVariantBOM & {
    material: Material;
  })[];
  product: Product;
}

export interface ProductVariantForDisplay extends ProductVariant {
  boms: {
    id: string;
    materialId: string;
    materialName: string;
    materialSku: string;
    quantityNeeded: number;
    wastePercentage: number;
    unitCost: number;
    totalCost: number;
    notes?: string | null;
  }[];
  totalMaterialCost: number;
  availableStock: number;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
}

// =============================================
// VARIANT CREATION TYPES
// =============================================

export interface CreateProductVariantInput {
  productId: string;
  sizeName?: string;
  sizeCode?: string;
  colorName?: string;
  colorCode?: string;
  styleName?: string;
  materialName?: string;
  unitCost: number;
  sellingPrice: number;
  minimumStockLevel: number;
  displayName: string;
  sortOrder?: number;
}

export interface CreateProductVariantBOMInput {
  productVariantId: string;
  materialId: string;
  quantityNeeded: number;
  wastePercentage: number;
  notes?: string;
}

export interface BulkCreateVariantsInput {
  productId: string;
  sizes: {
    sizeName: string;
    sizeCode: string;
    unitCost: number;
    sellingPrice: number;
    sortOrder: number;
  }[];
  colors: {
    colorName: string;
    colorCode?: string;
  }[];
  baseMaterials?: {
    materialId: string;
    quantityNeeded: number;
    wastePercentage: number;
  }[];
}

// =============================================
// VARIANT MANAGEMENT TYPES
// =============================================

export interface VariantMatrix {
  productId: string;
  productName: string;
  sizes: string[];
  colors: string[];
  variants: {
    [key: string]: {
      // key format: "size-color"
      variant: ProductVariant;
      hasBOM: boolean;
      totalCost: number;
      stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
    };
  };
}

export interface VariantBOMTemplate {
  id: string;
  name: string;
  description?: string;
  materials: {
    materialId: string;
    baseQuantity: number;
    sizeMultipliers: { [size: string]: number };
    colorVariations: { [color: string]: string }; // material substitutions for colors
    wastePercentage: number;
  }[];
}

// =============================================
// UI COMPONENT TYPES
// =============================================

export interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant?: ProductVariant;
  onVariantSelect: (variant: ProductVariant) => void;
  groupBy?: "size" | "color" | "style";
}

export interface VariantBOMEditorProps {
  variant: ProductVariantWithBOM;
  availableMaterials: Material[];
  onBOMUpdate: (bomEntries: CreateProductVariantBOMInput[]) => void;
  onSave: () => void;
}

export interface VariantStockCardProps {
  variant: ProductVariantForDisplay;
  showStockActions?: boolean;
  onStockAdjust?: (variantId: string, adjustment: number) => void;
}

// =============================================
// FORM TYPES
// =============================================

export interface VariantFormData {
  // Basic Info
  sizeName?: string;
  colorName?: string;
  styleName?: string;
  materialName?: string;

  // Pricing
  unitCost: number;
  sellingPrice: number;
  minimumStockLevel: number;

  // BOM
  materials: {
    materialId: string;
    quantityNeeded: number;
    wastePercentage: number;
    notes?: string;
  }[];
}

export interface BulkVariantFormData {
  // Size Selection
  sizes: {
    name: string;
    code: string;
    selected: boolean;
    costAdjustment: number; // percentage adjustment from base cost
    priceAdjustment: number; // percentage adjustment from base price
  }[];

  // Color Selection
  colors: {
    name: string;
    code?: string;
    selected: boolean;
  }[];

  // Base BOM Template
  useBOMTemplate: boolean;
  bomTemplate?: string;
  customBOM: {
    materialId: string;
    quantityNeeded: number;
    wastePercentage: number;
    sizeAdjustments?: { [size: string]: number };
    colorMaterialMap?: { [color: string]: string };
  }[];
}

// =============================================
// API RESPONSE TYPES
// =============================================

export interface VariantAPIResponse<T = ProductVariant> {
  success: boolean;
  data?: T;
  variants?: T[];
  message?: string;
  errors?: string[];
}

export interface VariantStatsResponse {
  totalVariants: number;
  activeVariants: number;
  variantsWithBOM: number;
  lowStockVariants: number;
  outOfStockVariants: number;
  totalValue: number;
}

// =============================================
// UTILITY TYPES
// =============================================

export type VariantAttribute = "size" | "color" | "style" | "material";

export interface VariantFilter {
  sizes?: string[];
  colors?: string[];
  styles?: string[];
  materials?: string[];
  inStock?: boolean;
  hasStockLevels?: boolean;
}

export interface VariantSort {
  field:
    | "displayName"
    | "sku"
    | "unitCost"
    | "sellingPrice"
    | "currentStock"
    | "sortOrder";
  direction: "asc" | "desc";
}

// =============================================
// CLOTHING SPECIFIC TYPES
// =============================================

export interface ClothingSize {
  name: string; // XS, S, M, L, XL, etc.
  code: string; // XS, S, M, L, XL, etc.
  sortOrder: number;
  measurements?: {
    chest?: number;
    waist?: number;
    length?: number;
    sleeve?: number;
  };
}

export interface ClothingColor {
  name: string; // Red, Blue, Navy, etc.
  code?: string; // Hex code, Pantone, etc.
  category?: "primary" | "secondary" | "neutral" | "accent";
  seasonality?: "spring" | "summer" | "fall" | "winter" | "year-round";
}

export interface ClothingVariantBOM extends ProductVariantBOM {
  materialCategory: "fabric" | "thread" | "hardware" | "packaging" | "trim";
  colorSensitive: boolean; // Whether this material changes based on garment color
  sizeSensitive: boolean; // Whether quantity changes based on size
}

// Common clothing size templates
export const CLOTHING_SIZES: ClothingSize[] = [
  { name: "XS", code: "XS", sortOrder: 1 },
  { name: "S", code: "S", sortOrder: 2 },
  { name: "M", code: "M", sortOrder: 3 },
  { name: "L", code: "L", sortOrder: 4 },
  { name: "XL", code: "XL", sortOrder: 5 },
  { name: "XXL", code: "XXL", sortOrder: 6 },
  { name: "XXXL", code: "XXXL", sortOrder: 7 },
];

// Common clothing colors
export const CLOTHING_COLORS: ClothingColor[] = [
  { name: "Black", code: "#000000", category: "neutral" },
  { name: "White", code: "#FFFFFF", category: "neutral" },
  { name: "Navy", code: "#000080", category: "primary" },
  { name: "Red", code: "#FF0000", category: "primary" },
  { name: "Blue", code: "#0000FF", category: "primary" },
  { name: "Green", code: "#008000", category: "secondary" },
  { name: "Gray", code: "#808080", category: "neutral" },
  { name: "Brown", code: "#A52A2A", category: "neutral" },
];

// =============================================
// ENHANCED BULK VARIANT CREATION TYPES
// =============================================

export interface BulkVariantCreationRequest {
  productId: string;
  sizes: Array<{
    name: string;
    code: string;
    priceModifier?: number; // Percentage modifier (e.g., 1.2 for 20% increase)
    costModifier?: number;
    sortOrder?: number;
  }>;
  colors: Array<{
    name: string;
    code?: string;
    priceModifier?: number;
    costModifier?: number;
  }>;
  inheritBOM: boolean;
  bomModifications?: Array<{
    materialId: string;
    quantityModifier: number; // e.g., 1.2 for XL (20% more material)
    sizeSpecific?: { [sizeName: string]: number }; // Size-specific multipliers
    colorSpecific?: { [colorName: string]: string }; // Color-specific material substitutions
  }>;
  baseSettings: {
    minimumStockLevel: number;
    initialStock?: number;
  };
}

export interface GroupedProductForDisplay {
  id: string;
  name: string;
  sku: string;
  description?: string;
  hasVariants: boolean;
  variantCount: number;
  totalStock: number;
  totalValue: number;
  lowStockVariants: number;
  category: {
    id: string;
    name: string;
  };
  variants: ProductVariantForDisplay[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VariantBOMInheritance {
  variantId: string;
  parentProductId: string;
  inheritedBOMs: Array<{
    originalBOMId: string;
    materialId: string;
    materialName: string;
    originalQuantity: number;
    adjustedQuantity: number;
    quantityModifier: number;
    reason: string; // "SIZE_ADJUSTMENT" | "COLOR_SUBSTITUTION" | "MANUAL_OVERRIDE"
  }>;
}

export interface BulkVariantCreationResult {
  success: boolean;
  createdVariants: ProductVariant[];
  createdBOMs: number;
  skippedVariants: Array<{
    sizeName: string;
    colorName: string;
    reason: string;
  }>;
  totalCreated: number;
  message: string;
  errors?: string[];
}
