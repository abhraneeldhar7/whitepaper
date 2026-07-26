"use client"

import { useState } from "react";
import { useDashboard, useDashboardStore } from "@/components/dashboard/dashboard-provider";
import DashboardRoot from "@/components/dashboard/dashboard-root";
import DashboardContent from "@/components/dashboard/dashboard-content";
import EntitySelector from "@/components/dashboard/entity-selector";
import { RibbonItemSkeleton } from "@/components/dashboard/ribbon-item";
import OverviewTab from "@/components/dashboard/tabs/overview-tab";
import MembersTab from "@/components/dashboard/tabs/members-tab";
import PlaceholderTab from "@/components/dashboard/placeholder-tab";
import NoWorkspace from "@/components/dashboard/no-workspace";

const TABS = ["Overview", "Members", "Plan", "Settings", "How to Use"];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { setWorkspaceId } = useDashboard();

  const isLoading = useDashboardStore((s) => s.isLoadingActiveWorkspace);
  const activeWorkspace = useDashboardStore((s) => s.activeWorkspace);
  const availableWorkspaces = useDashboardStore((s) => s.availableWorkspaces);

  const ribbon = activeWorkspace ? (
    <EntitySelector
      imageUrl={null}
      entity={{ id: activeWorkspace.workspaceId, name: activeWorkspace.workspaceName }}
      entityType="workspace"
      items={availableWorkspaces.map((ws) => ({ id: ws.workspaceId, name: ws.workspaceName }))}
      onSelect={(id) => setWorkspaceId(id)}
      disabled={availableWorkspaces.length === 0}
    />
  ) : (
    <RibbonItemSkeleton />
  );

  return (
    <DashboardRoot ribbon={ribbon}>
      <DashboardContent tabs={TABS} onTabChange={setActiveTab}>
        {!activeWorkspace ? (
          isLoading ? <OverviewTab loading={true} /> : <NoWorkspace />
        ) : activeTab === "overview" ? (
          <OverviewTab loading={true} />
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
