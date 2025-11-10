export interface OnboardingStep {
  title: string;
  description: string;
  imageUrl: string;
  highlights?: string[];
}

export type UserRoleKey =
  | "ADMIN"
  | "SUPER_ADMIN"
  | "WORKER"
  | "INSPECTOR"
  | "DELIVERY"
  | "DEVELOPER";

export const onboardingContent: Record<UserRoleKey, OnboardingStep[]> = {
  ADMIN: [
    {
      title: "Configure the Operations Backbone",
      description:
        "Set up products, materials, units, work centers, and user roles so downstream workflows stay accurate and auditable.",
      imageUrl: "/images/onboarding/admin/1.png",
      highlights: [
        "Create products, variants, and categories in the Products hub before intake",
        "Define material types, units of measure, and supplier links inside Materials",
        "Validate work centers and admin/user permissions under Settings > Users",
      ],
    },
    {
      title: "Register Customers & Suppliers",
      description:
        "Maintain customer and supplier directories with payment terms, lead times, and shipping data ready for every transaction.",
      imageUrl: "/images/onboarding/admin/2.png",
      highlights: [
        "Add customer accounts with credit limits and delivery addresses",
        "Update supplier contacts, lead times, and contracts for procurement coordination",
        "Ensure tax IDs and compliance fields are populated for billing",
      ],
    },
    {
      title: "Start at Mission Control",
      description:
        "Use the dashboard to understand demand, fulfillment progress, and any blockers that need your attention first.",
      imageUrl: "/images/onboarding/admin/3.png",
      highlights: [
        "Scan KPI cards for overdue orders and production load",
        "Watch timeline widgets for promised delivery windows",
        "Open Support chat whenever a team needs clarification",
      ],
    },
    {
      title: "Capture Customer Orders",
      description:
        "Create or review customer orders so every request has accurate products, variants, and promised quantities.",
      imageUrl: "/images/onboarding/admin/4.png",
      highlights: [
        "Use the Customer Orders list to add new orders or continue drafts",
        "Confirm pricing, variants, payment terms, and notes before saving",
        "Filter by status to triage urgent or pending approvals",
      ],
    },
    {
      title: "Analyze Orders & Launch Production",
      description:
        "Run the production-planning flows to allocate stock, generate production orders, and set fulfillment strategy per line.",
      imageUrl: "/images/onboarding/admin/5.png",
      highlights: [
        "Review stock vs. production recommendations from the Analyze workspace",
        "Allocate available inventory or open production orders directly from planning",
        "Confirm work-center routings and due dates before committing",
      ],
    },
    {
      title: "Secure Materials & Purchase Orders",
      description:
        "Cover material gaps and track supplier commitments so production schedules stay realistic.",
      imageUrl: "/images/onboarding/admin/6.png",
      highlights: [
        "Review material KPIs and low-stock alerts from the Materials hub",
        "Issue or update Purchase Orders to backfill shortages detected during planning",
        "Monitor expected deliveries and adjust reservations as timelines shift",
      ],
    },
    {
      title: "Monitor Production & Coordinate Quality",
      description:
        "Oversee production progress, unblock teams, and keep inspectors aligned on readiness milestones.",
      imageUrl: "/images/onboarding/admin/7.png",
      highlights: [
        "Track workflow progress, work centers, and history logs from Production detail pages",
        "Review worker updates and resolve blockers through support chat or notes",
        "Verify inspection readiness and address quality findings before delivery",
      ],
    },
    {
      title: "Deliver & Close the Books",
      description:
        "Coordinate delivery assignments, capture proof, and finalize billing and analytics for stakeholders.",
      imageUrl: "/images/onboarding/admin/8.png",
      highlights: [
        "Schedule delivery assignments and share tracking links once inspections pass",
        "Generate invoices or billing statements after proof of delivery is logged",
        "Export analytics and update support tickets to keep executives informed",
      ],
    },
  ],




  SUPER_ADMIN: [
    {
      title: "Assess Platform Health",
      description:
        "Start on the SuperAdmin dashboard to monitor cross-tenant production, inventory, and support metrics before diving into deep work.",
      imageUrl: "/images/onboarding/admin/3.png",
      highlights: [
        "Scan global KPIs for spikes in overdue orders, stockouts, or unresolved tickets",
        "Verify system status widgets and recent activity logs for anomalies",
        "Share a health summary with admin leads during daily coordination",
      ],
    },
    {
      title: "Coordinate Tenant Operations",
      description:
        "Use cross-tenant views in production, materials, and customer orders to identify bottlenecks that require executive intervention.",
      imageUrl: "/images/onboarding/admin/5.png",
      highlights: [
        "Compare tenant workloads to rebalance capacity across work centers",
        "Surface critical production orders and confirm inspectors or delivery teams are assigned",
        "Align admins, workers, and inspectors using the shared sync guides in scan-tech notes",
      ],
    },
    {
      title: "Execute Emergency Overrides",
      description:
        "Leverage SuperAdmin override actions to unblock stuck workflows while maintaining full audit trails for compliance.",
      imageUrl: "/images/onboarding/admin/7.png",
      highlights: [
        "Force-complete or pause production orders when standard validations block urgent work",
        "Adjust material reservations or production quantities after verifying downstream impact",
        "Document override reasons with 15+ character justifications for audit logs",
      ],
    },
    {
      title: "Govern Organizations & Access",
      description:
        "Manage organization configuration, resource limits, and high-privilege user access to keep the platform compliant and scalable.",
      imageUrl: "/images/onboarding/admin/2.png",
      highlights: [
        "Provision or suspend tenant orgs and update their configuration settings",
        "Review role assignments before promoting users to SuperAdmin or Developer",
        "Tune resource limits to align with contractual entitlements and capacity plans",
      ],
    },
    {
      title: "Enforce Compliance & Audits",
      description:
        "Audit activity logs, override trails, and support escalations to ensure every SuperAdmin action remains transparent and reviewable.",
      imageUrl: "/images/onboarding/admin/8.png",
      highlights: [
        "Review activityLog entries for override operations each day",
        "Export audit datasets for finance or compliance teams when requested",
        "Confirm escalations and recovery efforts are documented in support tickets",
      ],
    },
  ],
  WORKER: [
    {
      title: "Start with Your Daily Brief",
      description:
        "Open the worker dashboard to review assignments, deadlines, and work center alerts before you head to the floor.",
      imageUrl: "/images/onboarding/worker/1.png",
      highlights: [
        "Scan stats for pending, in-progress, and urgent operations",
        "Use quick actions to jump into Tasks, Operations, or QR Scanner",
        "Review upcoming work centers and recent activity for context",
      ],
    },
    {
      title: "Review Tasks & Prioritize",
      description:
        "Check the Tasks view to understand which production orders impact your stations and what needs attention first.",
      imageUrl: "/images/onboarding/worker/2.png",
      highlights: [
        "Filter tasks by status or promised dates to spot urgent work",
        "Open production order details for routing and material notes",
        "Sync with supervisors on high-priority orders before starting",
      ],
    },
    {
      title: "Execute Assigned Operations",
      description:
        "Use the Operations workspace to move each assigned step forward, log notes, and keep the timeline accurate.",
      imageUrl: "/images/onboarding/worker/3.png",
      highlights: [
        "Update statuses as you begin, pause, or complete tasks",
        "Document findings or handoff notes directly on the operation",
        "Verify prerequisites and dependencies before advancing",
      ],
    },
    {
      title: "Scan & Manage Materials",
      description:
        "Leverage the QR scanner and inventory views to confirm you have the right components and report shortages quickly.",
      imageUrl: "/images/onboarding/worker/4.png",
      highlights: [
        "Scan production order QR codes to jump to the right workflow",
        "Check material availability and alerts without leaving the floor",
        "Flag low stock or defects so admins can raise purchase orders",
      ],
    },
    {
      title: "Close the Loop with Support",
      description:
        "Wrap up your shift by closing tasks, logging blockers, and looping in inspectors or support when needed.",
      imageUrl: "/images/onboarding/worker/5.png",
      highlights: [
        "Confirm completed operations so inspectors receive notifications",
        "Escalate issues through chat or support tickets for quick resolution",
        "Review remaining tasks to prepare for the next shift",
      ],
    },
  ],
  INSPECTOR: [
    {
      title: "Inspection Workflow",
      description:
        "Review assigned inspections, capture findings, and approve lots from the inspector portal.",
      imageUrl: "/images/onboarding/inspector-dashboard.png",
      highlights: [
        "Filter inspections by priority",
        "Attach photos and comments for findings",
        "Trigger rework requests when needed",
      ],
    },
    {
      title: "Quality Sign-off",
      description:
        "Ensure products meet standards before releasing them to delivery teams.",
      imageUrl: "/images/onboarding/inspector-approval.png",
      highlights: [
        "Check material certificates",
        "Approve or reject production lots",
        "Notify stakeholders about quality status",
      ],
    },
  ],
  DELIVERY: [
    {
      title: "Plan Your Route",
      description:
        "See delivery assignments, customer details, and promised time windows in one place.",
      imageUrl: "/images/onboarding/delivery-assignments.png",
      highlights: [
        "Confirm pickup locations before heading out",
        "Review customer notes and instructions",
        "Update shipment status as you go",
      ],
    },
    {
      title: "Close the Loop",
      description:
        "Capture proof of delivery so billing and customer service stay in sync.",
      imageUrl: "/images/onboarding/delivery-confirmation.png",
      highlights: [
        "Log signatures or photo evidence",
        "Report issues immediately",
        "Mark deliveries complete to trigger invoicing",
      ],
    },
  ],
  DEVELOPER: [
    {
      title: "Developer Toolkit",
      description:
        "Access diagnostics, feature flags, and rollout tooling inside the developer workspace.",
      imageUrl: "/images/onboarding/developer-tools.png",
      highlights: [
        "Monitor system performance",
        "Toggle beta features safely",
        "Review logs and metrics in one hub",
      ],
    },
    {
      title: "Ship with Confidence",
      description:
        "Coordinate releases, track migrations, and keep stakeholders informed.",
      imageUrl: "/images/onboarding/developer-release.png",
      highlights: [
        "Follow the release checklist",
        "Validate rollbacks before deploying",
        "Share status updates with the wider team",
      ],
    },
  ],
};
