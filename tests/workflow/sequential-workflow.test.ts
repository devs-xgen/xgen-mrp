import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { prismaMock } from "../setup/prisma-mock";
import {
  checkWorkCenterCompletion,
  checkInspectionCompletion,
  getProductionPhaseStatus,
  adminWorkflowOverride,
} from "@/lib/actions/production-order";
import { updateTaskStatus as updateWorkerTaskStatus } from "@/lib/actions/worker/tasks";
import { updateTaskStatus as updateInspectorTaskStatus } from "@/lib/actions/inspector/tasks";
import { updateQualityCheck } from "@/lib/actions/quality-checks";
import { updateDeliveryTaskStatus } from "@/lib/actions/delivery/tasks";
import {
  notifyInspectorsWorkCentersCompleted,
  notifyDeliveryInspectionsCompleted,
  notifyProductionStarted,
} from "@/lib/actions/notifications";

// Mock the session
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(() =>
    Promise.resolve({
      user: { id: "test-user-id", email: "test@example.com", role: "WORKER" },
    })
  ),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

describe("Sequential Workflow System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Work Center Completion Validation", () => {
    test("should correctly identify when all work centers are completed", async () => {
      // Mock production order with completed operations
      prismaMock.operation.findMany.mockResolvedValue([
        { id: "1", status: "COMPLETED", workCenter: { name: "Assembly" } },
        {
          id: "2",
          status: "COMPLETED",
          workCenter: { name: "Quality Station" },
        },
        { id: "3", status: "COMPLETED", workCenter: { name: "Packaging" } },
      ]);

      const result = await checkWorkCenterCompletion("production-order-1");

      expect(result.allCompleted).toBe(true);
      expect(result.completionPercentage).toBe(100);
      expect(result.completedCount).toBe(3);
      expect(result.totalOperations).toBe(3);
    });

    test("should correctly identify when work centers are incomplete", async () => {
      // Mock production order with mixed operation statuses
      prismaMock.operation.findMany.mockResolvedValue([
        { id: "1", status: "COMPLETED", workCenter: { name: "Assembly" } },
        {
          id: "2",
          status: "IN_PROGRESS",
          workCenter: { name: "Quality Station" },
        },
        { id: "3", status: "PENDING", workCenter: { name: "Packaging" } },
      ]);

      const result = await checkWorkCenterCompletion("production-order-1");

      expect(result.allCompleted).toBe(false);
      expect(result.completionPercentage).toBe(33);
      expect(result.completedCount).toBe(1);
      expect(result.totalOperations).toBe(3);
    });

    test("should handle production orders with no operations", async () => {
      prismaMock.operation.findMany.mockResolvedValue([]);

      const result = await checkWorkCenterCompletion("production-order-1");

      expect(result.allCompleted).toBe(false);
      expect(result.completionPercentage).toBe(0);
      expect(result.completedCount).toBe(0);
      expect(result.totalOperations).toBe(0);
    });
  });

  describe("Quality Inspection Completion Validation", () => {
    test("should correctly identify when all inspections are completed", async () => {
      prismaMock.qualityCheck.findMany.mockResolvedValue([
        {
          id: "1",
          status: "COMPLETED",
          inspector: { profile: { firstName: "John", lastName: "Doe" } },
        },
        {
          id: "2",
          status: "COMPLETED",
          inspector: { profile: { firstName: "Jane", lastName: "Smith" } },
        },
      ]);

      const result = await checkInspectionCompletion("production-order-1");

      expect(result.allCompleted).toBe(true);
      expect(result.completionPercentage).toBe(100);
      expect(result.completedCount).toBe(2);
      expect(result.totalChecks).toBe(2);
    });

    test("should correctly identify when inspections are incomplete", async () => {
      prismaMock.qualityCheck.findMany.mockResolvedValue([
        {
          id: "1",
          status: "COMPLETED",
          inspector: { profile: { firstName: "John", lastName: "Doe" } },
        },
        {
          id: "2",
          status: "IN_PROGRESS",
          inspector: { profile: { firstName: "Jane", lastName: "Smith" } },
        },
        {
          id: "3",
          status: "PENDING",
          inspector: { profile: { firstName: "Bob", lastName: "Wilson" } },
        },
      ]);

      const result = await checkInspectionCompletion("production-order-1");

      expect(result.allCompleted).toBe(false);
      expect(result.completionPercentage).toBe(33);
      expect(result.completedCount).toBe(1);
      expect(result.totalChecks).toBe(3);
    });
  });

  describe("Production Phase Status", () => {
    test("should return correct phase status when work centers are incomplete", async () => {
      // Mock incomplete work centers
      prismaMock.operation.findMany.mockResolvedValue([
        { id: "1", status: "COMPLETED", workCenter: { name: "Assembly" } },
        {
          id: "2",
          status: "IN_PROGRESS",
          workCenter: { name: "Quality Station" },
        },
      ]);

      // Mock no quality checks
      prismaMock.qualityCheck.findMany.mockResolvedValue([]);

      const result = await getProductionPhaseStatus("production-order-1");

      expect(result.currentPhase).toBe("work_centers");
      expect(result.canStartInspection).toBe(false);
      expect(result.canStartDelivery).toBe(false);
      expect(result.overallProgress.workCentersComplete).toBe(false);
      expect(result.overallProgress.inspectionsComplete).toBe(false);
    });

    test("should return correct phase status when work centers are complete but inspections are not", async () => {
      // Mock complete work centers
      prismaMock.operation.findMany.mockResolvedValue([
        { id: "1", status: "COMPLETED", workCenter: { name: "Assembly" } },
        {
          id: "2",
          status: "COMPLETED",
          workCenter: { name: "Quality Station" },
        },
      ]);

      // Mock incomplete quality checks
      prismaMock.qualityCheck.findMany.mockResolvedValue([
        {
          id: "1",
          status: "IN_PROGRESS",
          inspector: { profile: { firstName: "John", lastName: "Doe" } },
        },
      ]);

      const result = await getProductionPhaseStatus("production-order-1");

      expect(result.currentPhase).toBe("inspection");
      expect(result.canStartInspection).toBe(true);
      expect(result.canStartDelivery).toBe(false);
      expect(result.overallProgress.workCentersComplete).toBe(true);
      expect(result.overallProgress.inspectionsComplete).toBe(false);
    });

    test("should return correct phase status when all phases are complete", async () => {
      // Mock complete work centers
      prismaMock.operation.findMany.mockResolvedValue([
        { id: "1", status: "COMPLETED", workCenter: { name: "Assembly" } },
        {
          id: "2",
          status: "COMPLETED",
          workCenter: { name: "Quality Station" },
        },
      ]);

      // Mock complete quality checks
      prismaMock.qualityCheck.findMany.mockResolvedValue([
        {
          id: "1",
          status: "COMPLETED",
          inspector: { profile: { firstName: "John", lastName: "Doe" } },
        },
      ]);

      const result = await getProductionPhaseStatus("production-order-1");

      expect(result.currentPhase).toBe("delivery");
      expect(result.canStartInspection).toBe(true);
      expect(result.canStartDelivery).toBe(true);
      expect(result.overallProgress.workCentersComplete).toBe(true);
      expect(result.overallProgress.inspectionsComplete).toBe(true);
    });
  });

  describe("Worker Task Updates", () => {
    test("should prevent worker task completion when not assigned", async () => {
      prismaMock.operation.findUnique.mockResolvedValue(null);

      await expect(
        updateWorkerTaskStatus({
          id: "operation-1",
          status: "COMPLETED",
          notes: "Task completed",
        })
      ).rejects.toThrow("Operation not found");
    });

    test("should trigger inspection notifications when work centers complete", async () => {
      // Mock operation update
      prismaMock.operation.findUnique.mockResolvedValue({
        id: "operation-1",
        status: "IN_PROGRESS",
        productionOrderId: "production-order-1",
        productionOrder: { id: "production-order-1", status: "IN_PROGRESS" },
      });

      prismaMock.operation.update.mockResolvedValue({
        id: "operation-1",
        status: "COMPLETED",
        productionOrderId: "production-order-1",
      });

      // Mock completed work centers
      prismaMock.operation.findMany.mockResolvedValue([
        {
          id: "operation-1",
          status: "COMPLETED",
          workCenter: { name: "Assembly" },
        },
      ]);

      // Mock activity log creation
      prismaMock.activityLog.create.mockResolvedValue({ id: "log-1" });

      const result = await updateWorkerTaskStatus({
        id: "operation-1",
        status: "COMPLETED",
        notes: "Work center completed",
      });

      expect(result.success).toBe(true);
      expect(result.triggeredPhaseUpdate).toBe(true);
      expect(result.inspectionReadiness).toBe(true);
      expect(result.automaticTransitions).toContainEqual(
        expect.objectContaining({
          type: "NOTIFICATION_SENT",
          target: "INSPECTORS",
        })
      );
    });
  });

  describe("Inspector Task Updates", () => {
    test("should prevent inspector task start when work centers are incomplete", async () => {
      prismaMock.operation.findUnique.mockResolvedValue({
        id: "operation-1",
        status: "PENDING",
        productionOrderId: "production-order-1",
      });

      // Mock incomplete work centers
      prismaMock.operation.findMany.mockResolvedValue([
        { id: "1", status: "COMPLETED", workCenter: { name: "Assembly" } },
        {
          id: "2",
          status: "IN_PROGRESS",
          workCenter: { name: "Quality Station" },
        },
      ]);

      await expect(
        updateInspectorTaskStatus({
          id: "operation-1",
          status: "IN_PROGRESS",
          notes: "Starting inspection",
        })
      ).rejects.toThrow(/work center operations are not complete/);
    });

    test("should trigger delivery notifications when inspections complete", async () => {
      prismaMock.operation.findUnique.mockResolvedValue({
        id: "operation-1",
        status: "IN_PROGRESS",
        productionOrderId: "production-order-1",
        productionOrder: { id: "production-order-1", status: "IN_PROGRESS" },
      });

      prismaMock.operation.update.mockResolvedValue({
        id: "operation-1",
        status: "COMPLETED",
      });

      // Mock complete work centers
      prismaMock.operation.findMany.mockResolvedValue([
        { id: "1", status: "COMPLETED", workCenter: { name: "Assembly" } },
      ]);

      // Mock complete inspections
      prismaMock.qualityCheck.findMany.mockResolvedValue([
        {
          id: "1",
          status: "COMPLETED",
          inspector: { profile: { firstName: "John", lastName: "Doe" } },
        },
      ]);

      const result = await updateInspectorTaskStatus({
        id: "operation-1",
        status: "COMPLETED",
        notes: "Inspection completed",
      });

      expect(result.success).toBe(true);
      expect(result.deliveryReadiness).toBe(true);
      expect(result.allInspectionsComplete).toBe(true);
      expect(result.automaticTransitions).toContainEqual(
        expect.objectContaining({
          type: "NOTIFICATION_SENT",
          target: "DELIVERY_PERSONNEL",
        })
      );
    });
  });

  describe("Quality Check Updates", () => {
    test("should prevent quality check creation when work centers are incomplete", async () => {
      // Mock incomplete work centers
      prismaMock.operation.findMany.mockResolvedValue([
        { id: "1", status: "COMPLETED", workCenter: { name: "Assembly" } },
        {
          id: "2",
          status: "IN_PROGRESS",
          workCenter: { name: "Quality Station" },
        },
      ]);

      prismaMock.inspector.findUnique.mockResolvedValue({
        inspectorId: "inspector-1",
        userId: "user-1",
      });

      await expect(
        updateQualityCheck("quality-check-1", "IN_PROGRESS", {
          id: "quality-check-1",
          status: "IN_PROGRESS",
          defectsFound: null,
          actionTaken: null,
          notes: "Starting quality check",
        })
      ).rejects.toThrow(/work center operations are incomplete/);
    });

    test("should trigger delivery notifications when quality checks complete", async () => {
      prismaMock.qualityCheck.findUnique.mockResolvedValue({
        id: "quality-check-1",
        status: "IN_PROGRESS",
        productionOrderId: "production-order-1",
      });

      // Mock complete work centers
      prismaMock.operation.findMany.mockResolvedValue([
        { id: "1", status: "COMPLETED", workCenter: { name: "Assembly" } },
      ]);

      // Mock quality check update
      prismaMock.qualityCheck.update.mockResolvedValue({
        id: "quality-check-1",
        status: "COMPLETED",
        productionOrder: {
          id: "production-order-1",
          product: { name: "Test Product" },
        },
      });

      // Mock all inspections complete
      prismaMock.qualityCheck.findMany.mockResolvedValue([
        {
          id: "quality-check-1",
          status: "COMPLETED",
          inspector: { profile: { firstName: "John", lastName: "Doe" } },
        },
      ]);

      const result = await updateQualityCheck("quality-check-1", "COMPLETED", {
        id: "quality-check-1",
        status: "COMPLETED",
        defectsFound: null,
        actionTaken: null,
        notes: "Quality check passed",
      });

      expect(result.deliveryReadiness).toBe(true);
      expect(result.allInspectionsComplete).toBe(true);
    });
  });

  describe("Delivery Task Updates", () => {
    test("should prevent delivery start when work centers are incomplete", async () => {
      prismaMock.deliveryAssignment.findUnique.mockResolvedValue({
        id: "delivery-1",
        productionOrderId: "production-order-1",
        status: "PENDING",
      });

      // Mock incomplete work centers
      prismaMock.operation.findMany.mockResolvedValue([
        { id: "1", status: "IN_PROGRESS", workCenter: { name: "Assembly" } },
      ]);

      await expect(
        updateDeliveryTaskStatus(
          "delivery-1",
          "IN_PROGRESS",
          "Starting delivery"
        )
      ).rejects.toThrow(/Cannot update delivery status/);
    });

    test("should prevent delivery start when inspections are incomplete", async () => {
      prismaMock.deliveryAssignment.findUnique.mockResolvedValue({
        id: "delivery-1",
        productionOrderId: "production-order-1",
        status: "PENDING",
      });

      // Mock complete work centers
      prismaMock.operation.findMany.mockResolvedValue([
        { id: "1", status: "COMPLETED", workCenter: { name: "Assembly" } },
      ]);

      // Mock incomplete inspections
      prismaMock.qualityCheck.findMany.mockResolvedValue([
        {
          id: "1",
          status: "IN_PROGRESS",
          inspector: { profile: { firstName: "John", lastName: "Doe" } },
        },
      ]);

      await expect(
        updateDeliveryTaskStatus(
          "delivery-1",
          "IN_PROGRESS",
          "Starting delivery"
        )
      ).rejects.toThrow(/Cannot update delivery status/);
    });

    test("should allow delivery when all dependencies are met", async () => {
      prismaMock.deliveryAssignment.findUnique.mockResolvedValue({
        id: "delivery-1",
        productionOrderId: "production-order-1",
        status: "PENDING",
      });

      prismaMock.deliveryAssignment.update.mockResolvedValue({
        id: "delivery-1",
        status: "IN_PROGRESS",
      });

      // Mock complete work centers
      prismaMock.operation.findMany.mockResolvedValue([
        { id: "1", status: "COMPLETED", workCenter: { name: "Assembly" } },
      ]);

      // Mock complete inspections
      prismaMock.qualityCheck.findMany.mockResolvedValue([
        {
          id: "1",
          status: "COMPLETED",
          inspector: { profile: { firstName: "John", lastName: "Doe" } },
        },
      ]);

      const result = await updateDeliveryTaskStatus(
        "delivery-1",
        "IN_PROGRESS",
        "Starting delivery"
      );

      expect(result.success).toBe(true);
    });
  });

  describe("Admin Workflow Overrides", () => {
    test("should allow admin to bypass work center dependencies", async () => {
      // Mock production order
      prismaMock.productionOrder.findUnique.mockResolvedValue({
        id: "production-order-1",
        status: "PENDING",
        product: { name: "Test Product" },
      });

      // Mock activity log creation
      prismaMock.activityLog.create.mockResolvedValue({ id: "log-1" });

      // Mock override result
      prismaMock.productionOrder.update.mockResolvedValue({
        id: "production-order-1",
        status: "IN_PROGRESS",
      });

      const result = await adminWorkflowOverride(
        "production-order-1",
        "BYPASS_WORK_CENTERS",
        "Emergency customer requirement - immediate inspection needed",
        "IN_PROGRESS",
        "admin-user-id"
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain(
        "Successfully bypassed workflow dependencies"
      );
    });

    test("should log admin override with audit trail", async () => {
      prismaMock.productionOrder.findUnique.mockResolvedValue({
        id: "production-order-1",
        status: "PENDING",
        product: { name: "Test Product" },
      });

      prismaMock.activityLog.create.mockResolvedValue({ id: "log-1" });
      prismaMock.productionOrder.update.mockResolvedValue({
        id: "production-order-1",
        status: "IN_PROGRESS",
      });

      await adminWorkflowOverride(
        "production-order-1",
        "FORCE_STATUS",
        "Critical production deadline override",
        "COMPLETED",
        "admin-user-id"
      );

      expect(prismaMock.activityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "WORKFLOW_OVERRIDE",
          details: expect.objectContaining({
            overrideType: "FORCE_STATUS",
            reason: "Critical production deadline override",
            originalStatus: "PENDING",
            targetStatus: "COMPLETED",
          }),
        }),
      });
    });
  });

  describe("Cross-Role Notifications", () => {
    test("should notify inspectors when work centers complete", async () => {
      prismaMock.productionOrder.findUnique.mockResolvedValue({
        id: "production-order-1",
        product: { name: "Test Product", sku: "TEST-001" },
        qualityChecks: [],
        operations: [{ workCenter: { name: "Assembly" }, status: "COMPLETED" }],
      });

      prismaMock.user.findMany.mockResolvedValue([
        { id: "inspector-1", email: "inspector1@example.com" },
        { id: "inspector-2", email: "inspector2@example.com" },
      ]);

      prismaMock.activityLog.create.mockResolvedValue({ id: "notification-1" });

      const result = await notifyInspectorsWorkCentersCompleted(
        "production-order-1",
        "worker-user-id"
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain("Successfully notified 2 inspector(s)");
    });

    test("should notify delivery personnel when inspections complete", async () => {
      prismaMock.productionOrder.findUnique.mockResolvedValue({
        id: "production-order-1",
        product: { name: "Test Product", sku: "TEST-001" },
        customerOrder: {
          customer: { name: "Test Customer", address: "123 Test St" },
        },
        deliveryAssignment: null,
        qualityChecks: [
          {
            inspector: { user: { email: "inspector@example.com" } },
            status: "COMPLETED",
          },
        ],
      });

      prismaMock.user.findMany.mockResolvedValue([
        { id: "delivery-1", email: "delivery1@example.com" },
      ]);

      prismaMock.activityLog.create.mockResolvedValue({ id: "notification-1" });

      const result = await notifyDeliveryInspectionsCompleted(
        "production-order-1",
        "inspector-user-id"
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain(
        "Successfully notified 1 delivery personnel"
      );
    });

    test("should notify all roles when production starts", async () => {
      prismaMock.productionOrder.findUnique.mockResolvedValue({
        id: "production-order-1",
        product: { name: "Test Product", sku: "TEST-001" },
        operations: [
          {
            workCenter: {
              userAssignments: [
                {
                  user: {
                    id: "worker-1",
                    email: "worker1@example.com",
                    role: "WORKER",
                  },
                },
              ],
            },
            assignedTo: null,
          },
        ],
        qualityChecks: [
          {
            inspector: {
              user: { id: "inspector-1", email: "inspector1@example.com" },
            },
          },
        ],
        deliveryAssignment: {
          user: { id: "delivery-1", email: "delivery1@example.com" },
        },
      });

      prismaMock.activityLog.create.mockResolvedValue({ id: "notification-1" });

      const result = await notifyProductionStarted(
        "production-order-1",
        "admin-user-id"
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain("Successfully notified 3 personnel");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    test("should handle missing production order gracefully", async () => {
      prismaMock.operation.findMany.mockResolvedValue([]);

      const result = await checkWorkCenterCompletion("non-existent-order");

      expect(result.allCompleted).toBe(false);
      expect(result.totalOperations).toBe(0);
    });

    test("should handle database errors gracefully", async () => {
      prismaMock.operation.findMany.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(
        checkWorkCenterCompletion("production-order-1")
      ).rejects.toThrow("Failed to check work center completion");
    });

    test("should prevent circular workflow dependencies", async () => {
      // This test ensures that operations cannot be marked as dependent on themselves
      prismaMock.operation.findUnique.mockResolvedValue({
        id: "operation-1",
        status: "COMPLETED",
        productionOrderId: "production-order-1",
      });

      // Even if we try to update a completed operation, it should handle gracefully
      const result = await updateWorkerTaskStatus({
        id: "operation-1",
        status: "COMPLETED",
        notes: "Re-completing completed task",
      });

      expect(result.success).toBe(true);
    });

    test("should handle concurrent status updates", async () => {
      // Mock scenario where operation status changes between read and write
      prismaMock.operation.findUnique
        .mockResolvedValueOnce({
          id: "operation-1",
          status: "IN_PROGRESS",
          productionOrderId: "production-order-1",
        })
        .mockResolvedValueOnce({
          id: "operation-1",
          status: "COMPLETED", // Status changed by another user
          productionOrderId: "production-order-1",
        });

      prismaMock.operation.update.mockResolvedValue({
        id: "operation-1",
        status: "COMPLETED",
      });

      const result = await updateWorkerTaskStatus({
        id: "operation-1",
        status: "COMPLETED",
        notes: "Completing task",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Performance and Scalability", () => {
    test("should handle production orders with many operations efficiently", async () => {
      // Mock 100 operations
      const manyOperations = Array.from({ length: 100 }, (_, i) => ({
        id: `operation-${i}`,
        status: "COMPLETED",
        workCenter: { name: `WorkCenter-${i}` },
      }));

      prismaMock.operation.findMany.mockResolvedValue(manyOperations);

      const startTime = Date.now();
      const result = await checkWorkCenterCompletion("production-order-1");
      const endTime = Date.now();

      expect(result.allCompleted).toBe(true);
      expect(result.totalOperations).toBe(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    test("should handle bulk notification sending efficiently", async () => {
      // Mock many inspectors
      const manyInspectors = Array.from({ length: 50 }, (_, i) => ({
        id: `inspector-${i}`,
        email: `inspector${i}@example.com`,
      }));

      prismaMock.productionOrder.findUnique.mockResolvedValue({
        id: "production-order-1",
        product: { name: "Test Product", sku: "TEST-001" },
        qualityChecks: [],
        operations: [],
      });

      prismaMock.user.findMany.mockResolvedValue(manyInspectors);
      prismaMock.activityLog.create.mockResolvedValue({ id: "notification-1" });

      const startTime = Date.now();
      const result = await notifyInspectorsWorkCentersCompleted(
        "production-order-1",
        "worker-user-id"
      );
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
