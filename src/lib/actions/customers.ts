"use server";

import { prisma } from "@/lib/db";
import { serializeDecimals } from "@/lib/utils/decimal-serializer";

export interface CustomerSearchFilters {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export async function getAllCustomers(filters?: CustomerSearchFilters) {
  try {
    const {
      search,
      status = "ACTIVE",
      limit = 100,
      offset = 0,
    } = filters || {};

    // Build where clause for filtering
    const where: any = {
      status: status,
    };

    // Add search functionality
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      where.OR = [
        {
          name: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          code: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          phone: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          contactPerson: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        contactPerson: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        tinNumber: true,
        creditLimit: true,
        paymentTerms: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: "asc",
      },
      take: limit,
      skip: offset,
    });

    return serializeDecimals(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw new Error("Failed to fetch customers");
  }
}

export async function searchCustomers(searchTerm: string, limit: number = 50) {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return [];
    }

    const customers = await getAllCustomers({
      search: searchTerm,
      status: "ACTIVE",
      limit,
    });

    return customers;
  } catch (error) {
    console.error("Error searching customers:", error);
    throw new Error("Failed to search customers");
  }
}

export async function getCustomerById(customerId: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
      select: {
        id: true,
        name: true,
        code: true,
        contactPerson: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        tinNumber: true,
        creditLimit: true,
        paymentTerms: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        // Include related data for better context
        orders: {
          select: {
            id: true,
            orderNumber: true,
            orderDate: true,
            totalAmount: true,
            status: true,
          },
          orderBy: {
            orderDate: "desc",
          },
          take: 5, // Last 5 orders
        },
        billingStatements: {
          select: {
            id: true,
            statementNumber: true,
            billingDate: true,
            totalAmount: true,
            status: true,
          },
          orderBy: {
            billingDate: "desc",
          },
          take: 5, // Last 5 billing statements
        },
      },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    return customer;
  } catch (error) {
    console.error("Error fetching customer by ID:", error);
    throw new Error("Failed to fetch customer details");
  }
}

export async function validateCustomerForBilling(customerId: string) {
  try {
    const customer = await getCustomerById(customerId);

    const validationResult = {
      isValid: true,
      customer,
      warnings: [] as string[],
      errors: [] as string[],
    };

    // Check customer status
    if (customer.status !== "ACTIVE") {
      validationResult.errors.push(
        `Customer status is ${customer.status}. Only active customers can be billed.`
      );
      validationResult.isValid = false;
    }

    // Check credit limit if applicable
    if (customer.creditLimit && customer.creditLimit > 0) {
      // Calculate outstanding amount from billing statements
      const outstandingAmount =
        customer.billingStatements
          ?.filter(
            (stmt) => stmt.status !== "PAID" && stmt.status !== "CANCELLED"
          )
          .reduce((sum, stmt) => sum + stmt.totalAmount, 0) || 0;

      if (outstandingAmount >= customer.creditLimit) {
        validationResult.warnings.push(
          `Customer has reached credit limit of ₱${customer.creditLimit.toLocaleString()}. Outstanding: ₱${outstandingAmount.toLocaleString()}`
        );
      }
    }

    // Check for missing essential information
    if (!customer.email) {
      validationResult.warnings.push(
        "Customer email is missing. This may affect billing delivery."
      );
    }

    if (!customer.address) {
      validationResult.warnings.push(
        "Customer address is missing. This may affect delivery."
      );
    }

    return validationResult;
  } catch (error) {
    console.error("Error validating customer for billing:", error);
    return {
      isValid: false,
      customer: null,
      warnings: [],
      errors: ["Failed to validate customer information"],
    };
  }
}

export async function getCustomerOrdersByCustomerId(customerId: string) {
  try {
    const customerOrders = await prisma.customerOrder.findMany({
      where: {
        customerId: customerId,
      },
      include: {
        customer: true,
        orderLines: {
          include: {
            product: true,
            productVariant: true,
          },
        },
        productionOrders: true,
        billingStatements: true,
        transaction: true,
        _count: {
          select: {
            orderLines: true,
            productionOrders: true,
            billingStatements: true,
          },
        },
      },
      orderBy: {
        orderDate: "desc",
      },
    });

    return customerOrders;
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    throw new Error("Failed to fetch customer orders");
  }
}

export async function getProductionOrdersByCustomerId(customerId: string) {
  try {
    // Get production orders that are linked to customer orders from this customer
    const productionOrders = await prisma.productionOrder.findMany({
      where: {
        customerOrder: {
          customerId: customerId,
        },
      },
      include: {
        product: true,
        productVariant: true,
        customerOrder: {
          include: {
            customer: true,
          },
        },
        operations: true,
        qualityChecks: true,
        delivery: true,
        costVariances: true,
        materialReservations: true,
        productionBatches: true,
        _count: {
          select: {
            operations: true,
            qualityChecks: true,
            materialReservations: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return productionOrders;
  } catch (error) {
    console.error("Error fetching production orders for customer:", error);
    throw new Error("Failed to fetch production orders");
  }
}
