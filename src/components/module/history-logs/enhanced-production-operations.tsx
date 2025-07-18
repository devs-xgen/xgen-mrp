import { getProductionOrderWithPhaseStatus, getProductionLogs } from "@/lib/actions/production-order"
import { convertDecimals } from "@/lib/convertDecimals" // Assuming this utility exists

export async function getProductionOrderWithLogs(productionOrderId: string) {
  try {
    const [orderDataRaw, activityLogs] = await Promise.all([
      getProductionOrderWithPhaseStatus(productionOrderId),
      getProductionLogs(productionOrderId),
    ])

    if (!orderDataRaw) {
      return null
    }

    // Convert Decimal fields to numbers for client component compatibility
    const orderData = convertDecimals(orderDataRaw)

    return {
      ...orderData,
      activityLogs, // Attach the fetched activity logs
    }
  } catch (error) {
    console.error("Error fetching production order with logs:", error)
    throw error
  }
}
