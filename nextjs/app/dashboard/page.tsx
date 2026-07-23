"use client"

import { useEffect, useState } from "react";
import { useDashboard, useDashboardStore } from "@/components/dashboard/dashboard-provider";
import DashboardRoot from "@/components/dashboard/dashboard-root";
import DashboardContent from "@/components/dashboard/dashboard-content";
import OverviewTab from "@/components/dashboard/tabs/overview-tab";
import MembersTab from "@/components/dashboard/tabs/members-tab";
import PlaceholderTab from "@/components/dashboard/placeholder-tab";
import NoWorkspace from "@/components/dashboard/no-workspace";
import type { ProjectWithRole, PaperWithRole } from "@/lib/api/services/dashboard";

const TABS = ["Overview", "Members", "Plan", "Settings", "How to Use"];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { resolveWorkspaceScreen } = useDashboard();
  const [projects, setProjects] = useState<ProjectWithRole[]>([]);
  const [papers, setPapers] = useState<PaperWithRole[]>([]);

  const wsm = useDashboardStore((s) => s.workspaceScreenMap);
  const activeWorkspace = useDashboardStore((s) => s.activeWorkspace);
  const workspaceId = activeWorkspace?.workspaceId;
  const loading = !wsm || wsm.isLoading;

  useEffect(() => {
    if (!workspaceId) return;
    resolveWorkspaceScreen().then((data) => {
      if (data) {
        setProjects(data.projects);
        setPapers(data.papers);
      }
    });
  }, [workspaceId]);

  if (!activeWorkspace && !wsm) {
    return (
      <DashboardRoot>
        <NoWorkspace />
      </DashboardRoot>
    );
  }

  return (
    <DashboardRoot>
      <DashboardContent tabs={TABS} onTabChange={setActiveTab}>
        {activeTab === "overview" && (
          <OverviewTab loading={loading} projects={projects} papers={papers} />
        )}
        {activeTab === "members" && <MembersTab />}
        {activeTab === "plan" && <PlaceholderTab name="Plan" />}
        {activeTab === "settings" && <PlaceholderTab name="Settings" />}
        {activeTab === "how_to_use" && <PlaceholderTab name="How to Use" />}
      </DashboardContent>
    </DashboardRoot>
  );
}
