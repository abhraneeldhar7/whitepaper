"use client"

import { useState } from "react";
import { useDashboardStore } from "@/components/dashboard/dashboard-provider";
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

  const isLoading = useDashboardStore((s) => s.isLoadingActiveWorkspace);
  const activeWorkspace = useDashboardStore((s) => s.activeWorkspace);

  return (
    <DashboardRoot ribbon={<DashboardRibbon />}>
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
