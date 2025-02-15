import { prisma } from "@/lib/db";
import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";


// GET /api/customer-orders/[id]
export async function GET_ID(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
  
    try {
      const customerOrder = await prisma.customerOrder.findUnique({
        where: { id: id as string }, // Convert id to string
        include: {
          customer: true,
          orderLines: true,
          productionOrders: true,
        //   transactions: true,
        },
      });
  
      if (customerOrder) {
        res.status(200).json(customerOrder);
      } else {
        res.status(404).json({ error: 'Customer order not found' });
      }
    } catch (error) {
      console.error("Error getting customer order:", error);
      res.status(500).json({ error: 'Failed to get customer order' });
    }
  }
  
  
  
  // PATCH /api/customer-orders/[id]
  export async function PATCH(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    const data = req.body;
  
    try {
      const updatedCustomerOrder = await prisma.customerOrder.update({
        where: { id: id as string },
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
          modifiedBy: data.modifiedBy, // Update modifiedBy
  
          orderLines: {
            upsert: data.orderLines?.map((orderLineData: any) => ({
              where: { id: orderLineData.id || '' }, // Assuming orderLineData has an ID
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
        //   transactions: true,
        },
      });
  
      res.status(200).json(updatedCustomerOrder);
    } catch (error) {
      console.error("Error updating customer order:", error);
      res.status(500).json({ error: 'Failed to update customer order' });
    }
  }
  
  
  // DELETE /api/customer-orders/[id]
  export async function DELETE(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
  
    try {
      await prisma.customerOrder.delete({
        where: { id: id as string },
      });
  
      res.status(204).end(); // 204 No Content
    } catch (error) {
      console.error("Error deleting customer order:", error);
      res.status(500).json({ error: 'Failed to delete customer order' });
    }
  }