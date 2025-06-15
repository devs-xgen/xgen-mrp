import { prisma } from "@/lib/db";
import { getBOMForProduct } from "../bom";

// CREATE
export async function createMaterialRequest(data: {
  requestDate: Date;
  requestedById: string;
  requiredDate: Date;
  status: string;
  priority: string;
  workCenterId: string;
  productionOrderId?: string;
  notes?: string;
  items: {
    inventoryItemId: string;
    quantityRequested: number;
    unit: string;
    notes?: string;
    status: string;
  }[];
}) {
  return await prisma.materialRequest.create({
    data: {
      ...data,
      items: {
        create: data.items.map((item) => ({
          ...item,
        })),
      },
    },
    include: {
      items: { include: { inventoryItem: true } },
      requestedBy: {
        select: {
          id: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
      workCenter: true,
    },
  });
}

// READ
export async function getMaterialRequestsByProductionOrder(productionOrderId: string) {
  return await prisma.materialRequest.findMany({
    where: { productionOrderId },
    include: {
      items: { include: { inventoryItem: true } },
      requestedBy: {
        select: {
          id: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
      approvedBy: {
        select: {
          id: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
      workCenter: true,
    },
  });
}

// UPDATE
export async function updateMaterialRequest(id: string, data: Partial<{
  status: string;
  priority: string;
  requiredDate: Date;
  approvedById: string | null;
  approvedDate: Date | null;
  fulfilledDate: Date | null;
  notes: string;
  items: {
    id: string;
    quantityRequested?: number;
    quantityApproved?: number | null;
    quantityFulfilled?: number | null;
    status?: string;
    notes?: string;
  }[];
}>) {
  const updateData: any = { ...data };

  // If items are provided, update each one
  if (data.items) {
    await Promise.all(
      data.items.map((item) =>
        prisma.materialRequestItem.update({
          where: { id: item.id },
          data: { ...item },
        })
      )
    );
  }

  return await prisma.materialRequest.update({
    where: { id },
    data: updateData,
    include: {
      items: { include: { inventoryItem: true } },
      requestedBy: {
        select: {
          id: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
      approvedBy: {
        select: {
          id: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
      workCenter: true,
    },
  });
}

// DELETE
export async function deleteMaterialRequest(id: string) {
  // delete children first due to foreign key constraint
  await prisma.materialRequestItem.deleteMany({
    where: { materialRequestId: id },
  });

  return await prisma.materialRequest.delete({
    where: { id },
  });
}


export async function getProductionOrderWithMaterialRequests(id: string) {
  try {
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      include: {
        product: true,
        customerOrder: true,
        operations: { include: { workCenter: true } },
        qualityChecks: true,
      },
    });

    if (!order) throw new Error("Production order not found");

    const materialRequests = await getMaterialRequestsByProductionOrder(id);
    const bom = await getBOMForProduct(order.productId);

    return { ...order, materialRequests, bom };
  } catch (error) {
    console.error("Error fetching production order with material requests:", error);
    throw error;
  }
}
