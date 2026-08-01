"use client"

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useDashboardStore, useDashboard } from "@/components/dashboard/dashboard-provider";
import DashboardRoot from "@/components/dashboard/dashboard-root";
import DashboardContent from "@/components/dashboard/dashboard-content";
import DashboardRibbon from "@/components/dashboard/dashboard-ribbon";
import OverviewTab from "@/components/dashboard/tabs/overview-tab";
import MembersTab from "@/components/dashboard/tabs/members-tab";
import PlaceholderTab from "@/components/dashboard/placeholder-tab";

const TABS = ["Overview", "Members", "Settings", "How to Use"];

export default function ProjectPage() {
  const params = useParams();
  const projectId = params["project-Id"] as string;
  const [activeTab, setActiveTab] = useState("overview");
  const { resolveProjectScreen } = useDashboard();

  
  useEffect(() => {
    resolveProjectScreen(projectId);
  }, [projectId]);
  
  const projectScreenMap = useDashboardStore((s) => s.projectScreenMap);
  const collections = useDashboardStore((s) => s.collections);
  const papers = useDashboardStore((s) => s.papers);
  const screenMap = projectScreenMap.find((psc) => psc.projectId === projectId);

  const overviewCollections = !screenMap
    ? []
    : collections.filter((c) => screenMap.collectionIdArray.includes(c.data.collectionId));

  const overviewPapers = !screenMap
    ? []
    : papers.filter((p) => screenMap.paperIdArray.includes(p.data.paperId));

  return (
    <DashboardRoot ribbon={<DashboardRibbon />}>
      <DashboardContent tabs={TABS} onTabChange={setActiveTab}>
        {activeTab === "overview" && (
          <OverviewTab loading={(!screenMap || screenMap.isLoading)} collections={overviewCollections} papers={overviewPapers} />
        )}
        {activeTab === "members" && <MembersTab />}
        {activeTab === "settings" && <PlaceholderTab name="Settings" />}
        {activeTab === "how_to_use" && <PlaceholderTab name="How to Use" />}
      </DashboardContent>
    </DashboardRoot>
  );
}
