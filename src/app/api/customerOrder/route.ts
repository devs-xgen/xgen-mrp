// POST /api/customer-orders
import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db"; // Ensure correct import path

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = req.body; // Get data from request body

    // Validate requiredDate and orderDate
    if (!data.requiredDate || isNaN(Date.parse(data.requiredDate))) {
      return res.status(400).json({ error: "Invalid or missing requiredDate" });
    }
    if (!data.orderDate || isNaN(Date.parse(data.orderDate))) {
      return res.status(400).json({ error: "Invalid or missing orderDate" });
    }

    // Validate numerical values
    if (isNaN(Number(data.totalAmount))) {
      return res.status(400).json({ error: "Invalid totalAmount" });
    }

    const customerOrder = await prisma.customerOrder.create({
      data: {
        orderNumber: data.orderNumber,
        customerId: data.customerId,
        orderDate: new Date(data.orderDate), // Ensure this is a Date
        requiredDate: new Date(data.requiredDate), // Properly formatted Date
        status: data.status,
        totalAmount: Number(data.totalAmount), // Ensure it's a number
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress,
        notes: data.notes,
        createdBy: data.createdBy,
        modifiedBy: data.modifiedBy,

        // Connect related records if needed (e.g., orderLines):
        orderLines: {
          create: data.orderLines?.map((orderLineData: any) => ({
            productId: orderLineData.productId,
            quantity: isNaN(Number(orderLineData.quantity)) ? 0 : Number(orderLineData.quantity),
            unitPrice: isNaN(Number(orderLineData.unitPrice)) ? 0 : Number(orderLineData.unitPrice),
            status: orderLineData.status,
            notes: orderLineData.notes,
            createdBy: orderLineData.createdBy,
            modifiedBy: orderLineData.modifiedBy,
          })),
        },
      },
    });

    res.status(201).json(customerOrder); // 201 Created
  } catch (error) {
    console.error("Error creating customer order:", error);
    res.status(500).json({ error: "Failed to create customer order" });
  }
}

// GET /api/customer-orders
export async function GET(req: NextApiRequest, res: NextApiResponse) {
  try {
    const customerOrders = await prisma.customerOrder.findMany({
      include: { // Include related data if needed
        customer: true,
        orderLines: true,
        productionOrders: true,
      },
    });
    res.status(200).json(customerOrders);
  } catch (error) {
    console.error("Error getting customer orders:", error);
    res.status(500).json({ error: 'Failed to get customer orders' });
  }
}
