// Helper functions to serialize Prisma objects for client components

export function serializeDecimal(value: any): number | null {
  if (value === null || value === undefined) return null
  return Number(value)
}

export function serializeProductionOrder(order: any) {
  return {
    ...order,
    // Convert Decimal fields to numbers
    plannedMaterialCost: serializeDecimal(order.plannedMaterialCost),
    actualMaterialCost: serializeDecimal(order.actualMaterialCost),
    materialVariance: serializeDecimal(order.materialVariance),

    // Handle nested objects
    operations:
      order.operations?.map((op: any) => ({
        ...op,
        cost: serializeDecimal(op.cost),
      })) || [],

    qualityChecks:
      order.qualityChecks?.map((qc: any) => ({
        ...qc,
        // Add any Decimal fields from quality checks if they exist
      })) || [],

    // Ensure dates are properly serialized
    createdAt: order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt),
    updatedAt: order.updatedAt instanceof Date ? order.updatedAt : new Date(order.updatedAt),
    startDate: order.startDate ? (order.startDate instanceof Date ? order.startDate : new Date(order.startDate)) : null,
    dueDate: order.dueDate ? (order.dueDate instanceof Date ? order.dueDate : new Date(order.dueDate)) : null,
    completedAt: order.completedAt
      ? order.completedAt instanceof Date
        ? order.completedAt
        : new Date(order.completedAt)
      : null,
  }
}

export function serializeQualityCheck(qc: any) {
  return {
    ...qc,
    // Convert any Decimal fields if they exist in quality checks
    checkDate: qc.checkDate instanceof Date ? qc.checkDate : new Date(qc.checkDate),
    createdAt: qc.createdAt instanceof Date ? qc.createdAt : new Date(qc.createdAt),
    updatedAt: qc.updatedAt instanceof Date ? qc.updatedAt : new Date(qc.updatedAt),
  }
}

export function serializeProductionIssue(issue: any) {
  return {
    ...issue,
    // Ensure dates are properly serialized
    createdAt: issue.createdAt instanceof Date ? issue.createdAt : new Date(issue.createdAt),
    updatedAt: issue.updatedAt instanceof Date ? issue.updatedAt : new Date(issue.updatedAt),
    resolvedAt: issue.resolvedAt
      ? issue.resolvedAt instanceof Date
        ? issue.resolvedAt
        : new Date(issue.resolvedAt)
      : null,
  }
}
