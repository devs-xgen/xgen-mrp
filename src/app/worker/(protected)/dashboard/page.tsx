// src/app/worker/(protected)/dashboard/page.tsx
import { Metadata } from "next";
import { getTodaysTasks, getTaskStatistics } from "@/lib/actions/worker/tasks";
import { getAssignedWorkCenters, getUpcomingOperations, getRecentActivity } from "@/lib/actions/worker/dashboard";
import { FullscreenButton } from "@/components/ui/fullscreen-button";
import {
  PageContainer,
  PageHeader,
  PageHeaderMain,
  PageTitle,
  PageDescription,
  PageHeaderActions,
  PageBody,
} from "@/components/shared/page-layout";
import { StatsCards } from "@/components/module/worker/dashboard/StatsCards";
import { DailyProgressCard } from "@/components/module/worker/dashboard/DailyProgressCard";
import { TodaysTasksCard } from "@/components/module/worker/dashboard/TodaysTasksCard";
import { QuickActionsCard } from "@/components/module/worker/dashboard/QuickActionsCard";
import { WorkCentersCard } from "@/components/module/worker/dashboard/WorkCentersCard";
import { UpcomingDeadlinesCard } from "@/components/module/worker/dashboard/UpcomingDeadlinesCard";
import { RecentActivityCard } from "@/components/module/worker/dashboard/RecentActivityCard";

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Worker Dashboard",
  description: "Your work overview and daily tasks",
};

export default async function WorkerDashboard() {
  const [todaysTasks, stats, centers, upcoming, activity] = await Promise.all([
    getTodaysTasks(),
    getTaskStatistics(),
    getAssignedWorkCenters(),
    getUpcomingOperations(),
    getRecentActivity(),
  ]);

  return (
    <PageContainer id="worker-dashboard">
      <PageHeader>
        <PageHeaderMain>
          <PageTitle>Worker Dashboard</PageTitle>
          <PageDescription>Your work overview and assigned tasks</PageDescription>
        </PageHeaderMain>
        <PageHeaderActions>
          <FullscreenButton containerId="worker-dashboard" variant="outline" showText />
        </PageHeaderActions>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Top stats */}
        <StatsCards stats={stats} />

        {/* Quick actions + assigned work centers */}
        <div className="grid gap-6 lg:grid-cols-3">
          <QuickActionsCard />
          <div className="lg:col-span-2">
            <WorkCentersCard centers={centers} />
          </div>
        </div>

        {/* Progress + upcoming deadlines */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DailyProgressCard stats={stats} />
          </div>
          <UpcomingDeadlinesCard items={upcoming} />
        </div>

        {/* Today's tasks + recent activity */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TodaysTasksCard tasks={todaysTasks} />
          </div>
          <RecentActivityCard items={activity} />
        </div>
      </PageBody>
    </PageContainer>
  );
}
