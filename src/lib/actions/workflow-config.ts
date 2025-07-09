"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Workflow configuration types
export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  ruleType: "DEPENDENCY" | "VALIDATION" | "NOTIFICATION" | "AUTOMATION";
  isActive: boolean;
  priority: number;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  modifiedBy?: string;
}

export interface WorkflowCondition {
  type:
    | "WORK_CENTER_COMPLETION"
    | "INSPECTION_COMPLETION"
    | "TIME_BASED"
    | "ROLE_BASED"
    | "CUSTOM";
  operator: "EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "NOT_EQUALS";
  value: any;
  field: string;
  description: string;
}

export interface WorkflowAction {
  type:
    | "BLOCK_TRANSITION"
    | "ALLOW_TRANSITION"
    | "SEND_NOTIFICATION"
    | "CREATE_TASK"
    | "LOG_EVENT";
  target: string;
  parameters: any;
  description: string;
}

export interface WorkflowConfiguration {
  id: string;
  name: string;
  description: string;
  isGlobal: boolean;
  workCenterRules: WorkflowRule[];
  inspectionRules: WorkflowRule[];
  deliveryRules: WorkflowRule[];
  notificationRules: WorkflowRule[];
  overrideRules: WorkflowRule[];
  isActive: boolean;
  version: string;
  effectiveDate: Date;
  expiryDate?: Date;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
}

// Default workflow configuration
const DEFAULT_WORKFLOW_CONFIG: Partial<WorkflowConfiguration> = {
  name: "Standard Production Workflow",
  description:
    "Default sequential workflow: Work Centers → Inspection → Delivery",
  isGlobal: true,
  workCenterRules: [
    {
      id: "wc-sequential-1",
      name: "Sequential Work Center Completion",
      description:
        "All work center operations must be completed before inspections can begin",
      ruleType: "DEPENDENCY",
      isActive: true,
      priority: 1,
      conditions: [
        {
          type: "WORK_CENTER_COMPLETION",
          operator: "EQUALS",
          value: "100",
          field: "completionPercentage",
          description: "Work centers must be 100% complete",
        },
      ],
      actions: [
        {
          type: "ALLOW_TRANSITION",
          target: "INSPECTION_PHASE",
          parameters: { enableInspections: true },
          description: "Enable inspection phase when work centers complete",
        },
        {
          type: "SEND_NOTIFICATION",
          target: "INSPECTORS",
          parameters: {
            template: "WORK_CENTERS_COMPLETED",
            priority: "HIGH",
          },
          description: "Notify inspectors when work centers are ready",
        },
      ],
      metadata: {
        enforceStrict: true,
        allowOverride: true,
        requiredRole: "ADMIN",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "system",
    } as WorkflowRule,
  ],
  inspectionRules: [
    {
      id: "insp-sequential-1",
      name: "Inspection Dependency Validation",
      description: "Inspections can only start after work centers are complete",
      ruleType: "VALIDATION",
      isActive: true,
      priority: 1,
      conditions: [
        {
          type: "WORK_CENTER_COMPLETION",
          operator: "EQUALS",
          value: "100",
          field: "completionPercentage",
          description: "Work centers must be complete before inspections",
        },
      ],
      actions: [
        {
          type: "BLOCK_TRANSITION",
          target: "INSPECTION_START",
          parameters: {
            errorMessage: "Cannot start inspections - work centers incomplete",
          },
          description: "Block inspection start when dependencies not met",
        },
      ],
      metadata: {
        blockingCondition: true,
        showProgress: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "system",
    } as WorkflowRule,
  ],
  deliveryRules: [
    {
      id: "del-sequential-1",
      name: "Delivery Dependency Validation",
      description:
        "Delivery can only start after both work centers and inspections are complete",
      ruleType: "VALIDATION",
      isActive: true,
      priority: 1,
      conditions: [
        {
          type: "WORK_CENTER_COMPLETION",
          operator: "EQUALS",
          value: "100",
          field: "completionPercentage",
          description: "Work centers must be complete",
        },
        {
          type: "INSPECTION_COMPLETION",
          operator: "EQUALS",
          value: "100",
          field: "completionPercentage",
          description: "Inspections must be complete",
        },
      ],
      actions: [
        {
          type: "BLOCK_TRANSITION",
          target: "DELIVERY_START",
          parameters: {
            errorMessage: "Cannot start delivery - dependencies incomplete",
          },
          description: "Block delivery start when dependencies not met",
        },
      ],
      metadata: {
        requireBoth: true,
        allowEmergencyOverride: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "system",
    } as WorkflowRule,
  ],
};

/**
 * Get current workflow configuration
 * @param configId Optional specific configuration ID
 * @returns Current workflow configuration
 */
export async function getWorkflowConfiguration(
  configId?: string
): Promise<WorkflowConfiguration> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Try to get from database first
    let config = null;

    try {
      config = await prisma.activityLog.findFirst({
        where: {
          type: "WORKFLOW_CONFIGURATION",
          ...(configId && {
            details: {
              path: ["configId"],
              equals: configId,
            },
          }),
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (dbError) {
      console.warn("Could not fetch workflow config from database:", dbError);
    }

    if (config?.details) {
      return config.details as WorkflowConfiguration;
    }

    // Return default configuration
    return {
      id: "default-config",
      version: "1.0.0",
      effectiveDate: new Date(),
      isActive: true,
      createdBy: "system",
      ...DEFAULT_WORKFLOW_CONFIG,
    } as WorkflowConfiguration;
  } catch (error) {
    console.error("Error getting workflow configuration:", error);
    throw new Error("Failed to get workflow configuration");
  }
}

/**
 * Update workflow configuration
 * @param config New configuration
 * @returns Updated configuration
 */
export async function updateWorkflowConfiguration(
  config: Partial<WorkflowConfiguration>
): Promise<WorkflowConfiguration> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    // Only admins can update workflow configuration
    if (session.user.role !== "ADMIN") {
      throw new Error("Only administrators can update workflow configuration");
    }

    const currentConfig = await getWorkflowConfiguration();

    const updatedConfig: WorkflowConfiguration = {
      ...currentConfig,
      ...config,
      id: config.id || `config-${Date.now()}`,
      version: incrementVersion(currentConfig.version),
      updatedAt: new Date(),
      modifiedBy: session.user.id,
    };

    // Validate configuration
    const validation = validateWorkflowConfiguration(updatedConfig);
    if (!validation.isValid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(", ")}`);
    }

    // Save configuration to database
    await prisma.activityLog.create({
      data: {
        type: "WORKFLOW_CONFIGURATION",
        userId: session.user.id,
        details: updatedConfig,
      },
    });

    // Log the configuration change
    await prisma.activityLog.create({
      data: {
        type: "WORKFLOW_CONFIG_UPDATE",
        userId: session.user.id,
        details: {
          configId: updatedConfig.id,
          previousVersion: currentConfig.version,
          newVersion: updatedConfig.version,
          changes: getConfigurationChanges(currentConfig, updatedConfig),
          timestamp: new Date().toISOString(),
        },
      },
    });

    revalidatePath("/admin/workflow/configuration");
    return updatedConfig;
  } catch (error) {
    console.error("Error updating workflow configuration:", error);
    throw error;
  }
}

/**
 * Create a new workflow rule
 * @param rule New rule to create
 * @returns Created rule
 */
export async function createWorkflowRule(
  rule: Omit<WorkflowRule, "id" | "createdAt" | "updatedAt" | "createdBy">
): Promise<WorkflowRule> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    if (session.user.role !== "ADMIN") {
      throw new Error("Only administrators can create workflow rules");
    }

    const newRule: WorkflowRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: session.user.id,
    };

    // Validate rule
    const validation = validateWorkflowRule(newRule);
    if (!validation.isValid) {
      throw new Error(`Invalid rule: ${validation.errors.join(", ")}`);
    }

    // Add rule to current configuration
    const currentConfig = await getWorkflowConfiguration();
    const ruleType = rule.ruleType;

    if (ruleType === "DEPENDENCY") {
      currentConfig.workCenterRules.push(newRule);
    } else if (ruleType === "VALIDATION") {
      currentConfig.inspectionRules.push(newRule);
    } else if (ruleType === "NOTIFICATION") {
      currentConfig.notificationRules.push(newRule);
    }

    await updateWorkflowConfiguration(currentConfig);

    return newRule;
  } catch (error) {
    console.error("Error creating workflow rule:", error);
    throw error;
  }
}

/**
 * Validate workflow configuration
 * @param config Configuration to validate
 * @returns Validation result
 */
export function validateWorkflowConfiguration(config: WorkflowConfiguration): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields validation
  if (!config.name || config.name.trim().length === 0) {
    errors.push("Configuration name is required");
  }

  if (!config.version) {
    errors.push("Configuration version is required");
  }

  // Rule validation
  const allRules = [
    ...config.workCenterRules,
    ...config.inspectionRules,
    ...config.deliveryRules,
    ...(config.notificationRules || []),
    ...(config.overrideRules || []),
  ];

  allRules.forEach((rule, index) => {
    const ruleValidation = validateWorkflowRule(rule);
    if (!ruleValidation.isValid) {
      errors.push(
        `Rule ${index + 1} (${rule.name}): ${ruleValidation.errors.join(", ")}`
      );
    }
    warnings.push(
      ...ruleValidation.warnings.map((w) => `Rule ${rule.name}: ${w}`)
    );
  });

  // Check for conflicting rules
  const activeRules = allRules.filter((rule) => rule.isActive);
  const conflictingRules = findConflictingRules(activeRules);
  if (conflictingRules.length > 0) {
    warnings.push(
      `Potentially conflicting rules found: ${conflictingRules.map((r) => r.name).join(", ")}`
    );
  }

  // Performance validation
  if (allRules.length > 100) {
    warnings.push("Large number of rules may impact performance");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate individual workflow rule
 * @param rule Rule to validate
 * @returns Validation result
 */
export function validateWorkflowRule(rule: WorkflowRule): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!rule.name || rule.name.trim().length === 0) {
    errors.push("Rule name is required");
  }

  if (!rule.ruleType) {
    errors.push("Rule type is required");
  }

  if (!rule.conditions || rule.conditions.length === 0) {
    errors.push("At least one condition is required");
  }

  if (!rule.actions || rule.actions.length === 0) {
    errors.push("At least one action is required");
  }

  // Condition validation
  rule.conditions.forEach((condition, index) => {
    if (
      !condition.type ||
      !condition.operator ||
      condition.value === undefined
    ) {
      errors.push(`Condition ${index + 1} is missing required fields`);
    }
  });

  // Action validation
  rule.actions.forEach((action, index) => {
    if (!action.type || !action.target) {
      errors.push(`Action ${index + 1} is missing required fields`);
    }
  });

  // Logic validation
  if (rule.priority < 0 || rule.priority > 100) {
    warnings.push("Priority should be between 0 and 100");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Apply workflow rules to a production order
 * @param productionOrderId Production order ID
 * @param phaseType Phase being validated
 * @param action Action being performed
 * @returns Validation result
 */
export async function applyWorkflowRules(
  productionOrderId: string,
  phaseType: "WORK_CENTER" | "INSPECTION" | "DELIVERY",
  action: "START" | "UPDATE" | "COMPLETE"
): Promise<{
  allowed: boolean;
  blockedBy: WorkflowRule[];
  triggered: WorkflowRule[];
  messages: string[];
  metadata: any;
}> {
  try {
    const config = await getWorkflowConfiguration();
    const context = await getProductionOrderContext(productionOrderId);

    let applicableRules: WorkflowRule[] = [];

    // Get rules for the specific phase
    switch (phaseType) {
      case "WORK_CENTER":
        applicableRules = config.workCenterRules;
        break;
      case "INSPECTION":
        applicableRules = config.inspectionRules;
        break;
      case "DELIVERY":
        applicableRules = config.deliveryRules;
        break;
    }

    // Filter active rules and sort by priority
    const activeRules = applicableRules
      .filter((rule) => rule.isActive)
      .sort((a, b) => a.priority - b.priority);

    const blockedBy: WorkflowRule[] = [];
    const triggered: WorkflowRule[] = [];
    const messages: string[] = [];
    const metadata: any = {};

    // Evaluate each rule
    for (const rule of activeRules) {
      const ruleResult = await evaluateRule(rule, context, action);

      if (ruleResult.matches) {
        triggered.push(rule);

        // Check if any action blocks the transition
        const blockingActions = rule.actions.filter(
          (a) => a.type === "BLOCK_TRANSITION"
        );
        if (blockingActions.length > 0) {
          blockedBy.push(rule);
          messages.push(
            ...blockingActions.map(
              (a) =>
                a.parameters?.errorMessage || `Blocked by rule: ${rule.name}`
            )
          );
        }

        // Collect other action results
        rule.actions.forEach((action) => {
          if (action.type === "LOG_EVENT") {
            messages.push(`Rule triggered: ${rule.name}`);
          }
        });

        metadata[rule.id] = ruleResult.metadata;
      }
    }

    return {
      allowed: blockedBy.length === 0,
      blockedBy,
      triggered,
      messages,
      metadata,
    };
  } catch (error) {
    console.error("Error applying workflow rules:", error);
    return {
      allowed: false,
      blockedBy: [],
      triggered: [],
      messages: ["Error evaluating workflow rules"],
      metadata: {},
    };
  }
}

// Helper functions
function incrementVersion(version: string): string {
  const parts = version.split(".");
  const patch = parseInt(parts[2] || "0", 10) + 1;
  return `${parts[0]}.${parts[1]}.${patch}`;
}

function getConfigurationChanges(
  oldConfig: WorkflowConfiguration,
  newConfig: WorkflowConfiguration
): any {
  return {
    name:
      oldConfig.name !== newConfig.name
        ? { from: oldConfig.name, to: newConfig.name }
        : undefined,
    rulesAdded:
      newConfig.workCenterRules.length - oldConfig.workCenterRules.length,
    isActiveChanged: oldConfig.isActive !== newConfig.isActive,
    // Add more change tracking as needed
  };
}

function findConflictingRules(rules: WorkflowRule[]): WorkflowRule[] {
  // Simple conflict detection - rules with same conditions but different actions
  const conflicts: WorkflowRule[] = [];

  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const rule1 = rules[i];
      const rule2 = rules[j];

      // Check if conditions are similar but actions conflict
      if (
        rule1.ruleType === rule2.ruleType &&
        rule1.priority === rule2.priority &&
        hasConflictingActions(rule1.actions, rule2.actions)
      ) {
        conflicts.push(rule1, rule2);
      }
    }
  }

  return [...new Set(conflicts)]; // Remove duplicates
}

function hasConflictingActions(
  actions1: WorkflowAction[],
  actions2: WorkflowAction[]
): boolean {
  // Check if one allows and another blocks the same target
  const allows1 = actions1.some((a) => a.type === "ALLOW_TRANSITION");
  const blocks1 = actions1.some((a) => a.type === "BLOCK_TRANSITION");
  const allows2 = actions2.some((a) => a.type === "ALLOW_TRANSITION");
  const blocks2 = actions2.some((a) => a.type === "BLOCK_TRANSITION");

  return (allows1 && blocks2) || (blocks1 && allows2);
}

async function getProductionOrderContext(
  productionOrderId: string
): Promise<any> {
  // Get production order with all related data for rule evaluation
  const {
    checkWorkCenterCompletion,
    checkInspectionCompletion,
    getProductionPhaseStatus,
  } = await import("@/lib/actions/production-order");

  const [workCenterStatus, inspectionStatus, phaseStatus] = await Promise.all([
    checkWorkCenterCompletion(productionOrderId),
    checkInspectionCompletion(productionOrderId),
    getProductionPhaseStatus(productionOrderId),
  ]);

  return {
    productionOrderId,
    workCenterStatus,
    inspectionStatus,
    phaseStatus,
    timestamp: new Date(),
  };
}

async function evaluateRule(
  rule: WorkflowRule,
  context: any,
  action: string
): Promise<{ matches: boolean; metadata: any }> {
  // Evaluate if rule conditions match the current context
  let matches = true;
  const metadata: any = {};

  for (const condition of rule.conditions) {
    const conditionResult = evaluateCondition(condition, context, action);
    if (!conditionResult.matches) {
      matches = false;
    }
    metadata[condition.type] = conditionResult.value;
  }

  return { matches, metadata };
}

function evaluateCondition(
  condition: WorkflowCondition,
  context: any,
  action: string
): { matches: boolean; value: any } {
  let contextValue: any;

  // Extract value from context based on condition type
  switch (condition.type) {
    case "WORK_CENTER_COMPLETION":
      contextValue = context.workCenterStatus?.completionPercentage || 0;
      break;
    case "INSPECTION_COMPLETION":
      contextValue = context.inspectionStatus?.completionPercentage || 0;
      break;
    default:
      contextValue = null;
  }

  // Apply operator
  let matches = false;
  switch (condition.operator) {
    case "EQUALS":
      matches = contextValue === parseInt(condition.value);
      break;
    case "GREATER_THAN":
      matches = contextValue > parseInt(condition.value);
      break;
    case "LESS_THAN":
      matches = contextValue < parseInt(condition.value);
      break;
    case "NOT_EQUALS":
      matches = contextValue !== parseInt(condition.value);
      break;
    default:
      matches = false;
  }

  return { matches, value: contextValue };
}
