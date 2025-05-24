'use server'

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProductionOrders } from "@/lib/actions/production-order";

export async function getInspectorTasks() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return [];

  const allOrders = await getProductionOrders();
  // const inspectorId = session.user.id;
  // return allOrders.filter(order => order.inspectorId === inspectorId);
  return allOrders;
}