"use client"

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useDashboard, useDashboardStore } from "@/components/dashboard/dashboard-provider";
import DashboardRoot from "@/components/dashboard/dashboard-root";
import DashboardContent from "@/components/dashboard/dashboard-content";
import OverviewTab from "@/components/dashboard/tabs/overview-tab";
import MembersTab from "@/components/dashboard/tabs/members-tab";
import PlaceholderTab from "@/components/dashboard/placeholder-tab";

const TABS = ["Overview", "Members", "Settings", "How to Use"];

function tabKey(tab: string) {
  return tab.toLowerCase().replace(/\s+/g, "_");
}

export default function CollectionPage() {
  const params = useParams();
  const projectId = params["project-Id"] as string;
  const collectionId = params["collection-Id"] as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || tabKey(TABS[0]));
  const { projectScreen, collectionScreen } = useDashboard();

  useEffect(() => {
    Promise.all([
      projectScreen(projectId),
      collectionScreen(collectionId),
    ]);
  }, [projectId, collectionId, projectScreen, collectionScreen]);

  useEffect(() => {
    setActiveTab(searchParams.get("tab") || tabKey(TABS[0]));
  }, [searchParams]);

  const onTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
  };

  const csc = useDashboardStore((s) =>
    s.collectionScreenMap.find((x) => x.collectionId === collectionId)
  );
  const papers = useDashboardStore((s) => s.papers);
  const loading = !csc || csc.lastFetched === 0;

  const collectionPapers = csc
    ? papers.filter((p) => csc.paperIdArray.includes(p.paperId))
    : [];

  return (
    <DashboardRoot>
      <DashboardContent tabs={TABS} currentTab={activeTab} onTabChange={onTabChange}>
        {activeTab === tabKey("Overview") && (
          <OverviewTab loading={loading} papers={collectionPapers} />
        )}
        {activeTab === tabKey("Members") && <MembersTab />}
        {activeTab === tabKey("Settings") && <PlaceholderTab name="Settings" />}
        {activeTab === tabKey("How to Use") && <PlaceholderTab name="How to Use" />}
      </DashboardContent>
    </DashboardRoot>
  );
}
