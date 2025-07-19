import { getProductionLogs } from "@/lib/actions/production-order"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productionOrderId = searchParams.get("productionOrderId")

    if (!productionOrderId) {
      return NextResponse.json({ error: "Production Order ID is required" }, { status: 400 })
    }

    const logs = await getProductionLogs(productionOrderId)
    return NextResponse.json(logs)
  } catch (error) {
    console.error("Error in API route /api/activity-log:", error)
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 })
  }
}
