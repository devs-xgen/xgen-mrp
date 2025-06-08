-- AddColumn
ALTER TABLE "Product" ADD COLUMN     "hasSizeVariants" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ProductSizeVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sizeName" TEXT NOT NULL,
    "sizeCode" TEXT NOT NULL,
    "unitCost" DECIMAL(10,2) NOT NULL,
    "sellingPrice" DECIMAL(10,2) NOT NULL,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "minimumStockLevel" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "modifiedBy" TEXT,

    CONSTRAINT "ProductSizeVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSizeVariantBOM" (
    "id" TEXT NOT NULL,
    "productSizeVariantId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantityNeeded" DECIMAL(10,3) NOT NULL,
    "wastePercentage" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "modifiedBy" TEXT,

    CONSTRAINT "ProductSizeVariantBOM_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductSizeVariant_productId_idx" ON "ProductSizeVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductSizeVariant_sizeName_idx" ON "ProductSizeVariant"("sizeName");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSizeVariant_productId_sizeName_key" ON "ProductSizeVariant"("productId", "sizeName");

-- CreateIndex
CREATE INDEX "ProductSizeVariantBOM_productSizeVariantId_idx" ON "ProductSizeVariantBOM"("productSizeVariantId");

-- CreateIndex
CREATE INDEX "ProductSizeVariantBOM_materialId_idx" ON "ProductSizeVariantBOM"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSizeVariantBOM_productSizeVariantId_materialId_key" ON "ProductSizeVariantBOM"("productSizeVariantId", "materialId");

-- AddForeignKey
ALTER TABLE "ProductSizeVariant" ADD CONSTRAINT "ProductSizeVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSizeVariantBOM" ADD CONSTRAINT "ProductSizeVariantBOM_productSizeVariantId_fkey" FOREIGN KEY ("productSizeVariantId") REFERENCES "ProductSizeVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSizeVariantBOM" ADD CONSTRAINT "ProductSizeVariantBOM_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON UPDATE CASCADE; 