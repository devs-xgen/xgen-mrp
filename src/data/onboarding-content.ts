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
      title: "Super Admin Overview",
      description:
        "Configure global settings, manage organizations, and unblock teams when they need help.",
      imageUrl: "/images/onboarding/super-admin-overview.png",
      highlights: [
        "Review platform health checks",
        "Provision users and adjust permissions",
        "Monitor audit logs for sensitive operations",
      ],
    },
    {
      title: "Stay Proactive",
      description:
        "Use insights to anticipate issues before they impact production or deliveries.",
      imageUrl: "/images/onboarding/super-admin-insights.png",
      highlights: [
        "Track material shortages across sites",
        "Confirm compliance tasks are on schedule",
        "Coordinate escalations with stakeholders",
      ],
    },
  ],
  WORKER: [
    {
      title: "Your Daily Brief",
      description:
        "Start on the dashboard to see tasks, deadlines, and work center alerts.",
      imageUrl: "/images/onboarding/worker-dashboard.png",
      highlights: [
        "Check upcoming operations",
        "Scan QR codes to update order status",
        "View inventory alerts before you begin",
      ],
    },
    {
      title: "Execute with Confidence",
      description:
        "Log progress, add notes, and request support as you move through each operation.",
      imageUrl: "/images/onboarding/worker-operations.png",
      highlights: [
        "Mark tasks complete to notify supervisors",
        "Flag blockers or defects instantly",
        "Use support chat to coordinate in real time",
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
