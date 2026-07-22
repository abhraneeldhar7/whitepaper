"use client"

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDashboardStore } from "@/lib/zustand/store";
import DashboardRoot from "@/components/dashboard/dashboard-root";
import DashboardContent from "@/components/dashboard/dashboard-content";
import OverviewTab from "@/components/dashboard/tabs/overview-tab";
import MembersTab from "@/components/dashboard/tabs/members-tab";
import PlaceholderTab from "@/components/dashboard/placeholder-tab";
import NoWorkspace from "@/components/dashboard/no-workspace";

const TABS = ["Overview", "Members", "Plan", "Settings", "How to Use"];

function tabKey(tab: string) {
  return tab.toLowerCase().replace(/\s+/g, "_");
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || tabKey(TABS[0]));

  useEffect(() => {
    setActiveTab(searchParams.get("tab") || tabKey(TABS[0]));
  }, [searchParams]);

  const onTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
  };

  const hydrated = useDashboardStore((s) => s.hydrated);
  const activeWorkspace = useDashboardStore((s) => s.activeWorkspace);
  const wsc = useDashboardStore((s) => s.workspaceScreenContent);
  const projects = useDashboardStore((s) => s.projects);
  const papers = useDashboardStore((s) => s.papers);
  const loading = !wsc || wsc.lastFetched === 0;

  if (hydrated && !activeWorkspace) {
    return (
      <DashboardRoot>
        <NoWorkspace />
      </DashboardRoot>
    );
  }

  return (
    <DashboardRoot>
      <DashboardContent tabs={TABS} currentTab={activeTab} onTabChange={onTabChange}>
        {activeTab === tabKey("Overview") && (
          <OverviewTab loading={loading} projects={projects} papers={papers} />
        )}
        {activeTab === tabKey("Members") && <MembersTab />}
        {activeTab === tabKey("Plan") && <PlaceholderTab name="Plan" />}
        {activeTab === tabKey("Settings") && <PlaceholderTab name="Settings" />}
        {activeTab === tabKey("How to Use") && <PlaceholderTab name="How to Use" />}
      </DashboardContent>
    </DashboardRoot>
  );
}
