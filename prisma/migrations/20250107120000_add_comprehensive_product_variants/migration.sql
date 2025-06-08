-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "sizeName" TEXT,
    "sizeCode" TEXT,
    "colorName" TEXT,
    "colorCode" TEXT,
    "styleName" TEXT,
    "materialName" TEXT,
    "unitCost" DECIMAL(10,2) NOT NULL,
    "sellingPrice" DECIMAL(10,2) NOT NULL,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "minimumStockLevel" INTEGER NOT NULL DEFAULT 0,
    "expectedStock" INTEGER NOT NULL DEFAULT 0,
    "committedStock" INTEGER NOT NULL DEFAULT 0,
    "displayName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "modifiedBy" TEXT,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariantBOM" (
    "id" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantityNeeded" DECIMAL(10,3) NOT NULL,
    "wastePercentage" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "modifiedBy" TEXT,

    CONSTRAINT "ProductVariantBOM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLineVariant" (
    "id" TEXT NOT NULL,
    "orderLineId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderLineVariant_pkey" PRIMARY KEY ("id")
);

-- Add deprecation flag to existing size variant tables
ALTER TABLE "ProductSizeVariant" ADD COLUMN "isDeprecated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProductSizeVariantBOM" ADD COLUMN "isDeprecated" BOOLEAN NOT NULL DEFAULT false;

-- Update Product model to use hasVariants instead of hasSizeVariants
ALTER TABLE "Product" RENAME COLUMN "hasSizeVariants" TO "hasVariants";

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_sizeName_colorName_key" ON "ProductVariant"("productId", "sizeName", "colorName");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductVariant_sizeName_idx" ON "ProductVariant"("sizeName");

-- CreateIndex
CREATE INDEX "ProductVariant_colorName_idx" ON "ProductVariant"("colorName");

-- CreateIndex
CREATE INDEX "ProductVariant_sku_idx" ON "ProductVariant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantBOM_productVariantId_materialId_key" ON "ProductVariantBOM"("productVariantId", "materialId");

-- CreateIndex
CREATE INDEX "ProductVariantBOM_productVariantId_idx" ON "ProductVariantBOM"("productVariantId");

-- CreateIndex
CREATE INDEX "ProductVariantBOM_materialId_idx" ON "ProductVariantBOM"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderLineVariant_orderLineId_variantId_key" ON "OrderLineVariant"("orderLineId", "variantId");

-- CreateIndex
CREATE INDEX "OrderLineVariant_orderLineId_idx" ON "OrderLineVariant"("orderLineId");

-- CreateIndex
CREATE INDEX "OrderLineVariant_variantId_idx" ON "OrderLineVariant"("variantId");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantBOM" ADD CONSTRAINT "ProductVariantBOM_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantBOM" ADD CONSTRAINT "ProductVariantBOM_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLineVariant" ADD CONSTRAINT "OrderLineVariant_orderLineId_fkey" FOREIGN KEY ("orderLineId") REFERENCES "OrderLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLineVariant" ADD CONSTRAINT "OrderLineVariant_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON UPDATE CASCADE;

-- Data Migration: Migrate existing ProductSizeVariant to ProductVariant
-- This will create ProductVariant records for each existing size variant (without colors initially)
INSERT INTO "ProductVariant" (
    "id",
    "productId", 
    "sku",
    "sizeName",
    "sizeCode", 
    "unitCost",
    "sellingPrice",
    "currentStock",
    "minimumStockLevel",
    "displayName",
    "sortOrder",
    "createdAt",
    "updatedAt",
    "createdBy",
    "modifiedBy"
)
SELECT 
    "id",
    "productId",
    "productId" || '-' || "sizeName" as "sku", -- Generate basic SKU
    "sizeName",
    "sizeCode",
    "unitCost",
    "sellingPrice", 
    "currentStock",
    "minimumStockLevel",
    "sizeName" as "displayName",
    "sortOrder",
    "createdAt",
    "updatedAt",
    "createdBy",
    "modifiedBy"
FROM "ProductSizeVariant"
WHERE "isDeprecated" = false;

-- Migrate existing ProductSizeVariantBOM to ProductVariantBOM
INSERT INTO "ProductVariantBOM" (
    "id",
    "productVariantId",
    "materialId",
    "quantityNeeded", 
    "wastePercentage",
    "createdAt",
    "updatedAt",
    "createdBy",
    "modifiedBy"
)
SELECT 
    "id",
    "productSizeVariantId",
    "materialId", 
    "quantityNeeded",
    "wastePercentage",
    "createdAt",
    "updatedAt",
    "createdBy",
    "modifiedBy"
FROM "ProductSizeVariantBOM" 
WHERE "isDeprecated" = false;

-- Mark migrated records as deprecated
UPDATE "ProductSizeVariant" SET "isDeprecated" = true;
UPDATE "ProductSizeVariantBOM" SET "isDeprecated" = true; 