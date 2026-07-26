"use client"

import { useEffect, useState } from "react";
import { useDashboardStore, useDashboard } from "@/components/dashboard/dashboard-provider";
import DashboardRoot from "@/components/dashboard/dashboard-root";
import DashboardContent from "@/components/dashboard/dashboard-content";
import DashboardRibbon from "@/components/dashboard/dashboard-ribbon";
import OverviewTab from "@/components/dashboard/tabs/overview-tab";
import MembersTab from "@/components/dashboard/tabs/members-tab";
import PlaceholderTab from "@/components/dashboard/placeholder-tab";
import NoWorkspace from "@/components/dashboard/no-workspace";

const TABS = ["Overview", "Members", "Plan", "Settings", "How to Use"];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { resolveWorkspaceScreen } = useDashboard();

  const isLoading = useDashboardStore((s) => s.isLoadingActiveWorkspace);
  const activeWorkspace = useDashboardStore((s) => s.activeWorkspace);
  const workspaceScreenMap = useDashboardStore((s) => s.workspaceScreenMap);
  const projects = useDashboardStore((s) => s.projects);
  const papers = useDashboardStore((s) => s.papers);

  useEffect(() => {
    if (activeWorkspace) {
      resolveWorkspaceScreen();
    }
  }, [activeWorkspace]);

  const overviewLoading = !workspaceScreenMap || workspaceScreenMap.isLoading;

  const overviewProjects = !workspaceScreenMap
    ? []
    : projects.filter((p) => workspaceScreenMap.projectIdArray.includes(p.projectId));

  const overviewPapers = !workspaceScreenMap
    ? []
    : papers.filter((p) => workspaceScreenMap.paperIdArray.includes(p.paperId));

  return (
    <DashboardRoot ribbon={<DashboardRibbon />}>
      <DashboardContent tabs={TABS} onTabChange={setActiveTab}>
        {!activeWorkspace ? (
          isLoading ? <OverviewTab loading={true} /> : <NoWorkspace />
        ) : activeTab === "overview" ? (
          <OverviewTab loading={overviewLoading} projects={overviewProjects} papers={overviewPapers} />
        ) : activeTab === "members" ? (
          <MembersTab />
        ) : activeTab === "plan" ? (
          <PlaceholderTab name="Plan" />
        ) : activeTab === "settings" ? (
          <PlaceholderTab name="Settings" />
        ) : (
          <PlaceholderTab name="How to Use" />
        )}
      </DashboardContent>
    </DashboardRoot>
  );
}
