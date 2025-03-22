import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { CustomerOrderLineSchema } from "@/lib/customer-order";
import { z } from "zod";

// GET /api/customerOrder/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const customerOrder = await prisma.customerOrder.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        orderLines: true,
        productionOrders: true,
      },
    });

    if (customerOrder) {
      return NextResponse.json(customerOrder);
    } else {
      return new NextResponse(JSON.stringify({ error: 'Customer order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error("Error getting customer order:", error);
    return new NextResponse(JSON.stringify({ error: 'Failed to get customer order' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// PATCH /api/customerOrder/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    const updatedCustomerOrder = await prisma.customerOrder.update({
      where: { id: params.id },
      data: {
        orderNumber: data.orderNumber,
        customerId: data.customerId,
        orderDate: data.orderDate,
        requiredDate: data.requiredDate,
        status: data.status,
        totalAmount: data.totalAmount,
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress,
        notes: data.notes,
        modifiedBy: data.modifiedBy,

        orderLines: {
          upsert: data.orderLines?.map((orderLineData: z.infer<typeof CustomerOrderLineSchema> & { id?: string }) => ({
            where: { id: orderLineData.id || '' },
            update: {
              productId: orderLineData.productId,
              quantity: orderLineData.quantity,
              unitPrice: orderLineData.unitPrice,
              status: orderLineData.status,
              notes: orderLineData.notes,
              modifiedBy: orderLineData.modifiedBy
            },
            create: {
              productId: orderLineData.productId,
              quantity: orderLineData.quantity,
              unitPrice: orderLineData.unitPrice,
              status: orderLineData.status,
              notes: orderLineData.notes,
              createdBy: orderLineData.createdBy,
              modifiedBy: orderLineData.modifiedBy
            },
          })),
        },
      },
      include: {
        customer: true,
        orderLines: true,
        productionOrders: true,
      },
    });

    return NextResponse.json(updatedCustomerOrder);
  } catch (error) {
    console.error("Error updating customer order:", error);
    return new NextResponse(JSON.stringify({ error: 'Failed to update customer order' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE /api/customerOrder/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.customerOrder.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting customer order:", error);
    return new NextResponse(JSON.stringify({ error: 'Failed to delete customer order' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}