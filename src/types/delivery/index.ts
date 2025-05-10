import { DeliveryAssignment, ProductionOrder, Product, CustomerOrder, Customer, Status } from "@prisma/client";

export type DeliveryAssignmentWithDetails = DeliveryAssignment & {
  productionOrder: ProductionOrder & {
    product: Product;
    customerOrder: CustomerOrder & {
      customer: Customer;
    };
  };
};

export type DeliveryStatus = Status;

export interface DeliveryDashboardProps {
  assignments: DeliveryAssignmentWithDetails[];
}

export interface DeliveryOrderDetailsProps {
  assignment: DeliveryAssignmentWithDetails;
}

export interface DeliveryStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
} 