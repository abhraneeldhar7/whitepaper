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

export default function CollectionPage() {
  const params = useParams();
  const collectionId = params["collection-Id"] as string;
  const [activeTab, setActiveTab] = useState("overview");
  const { resolveCollectionScreen } = useDashboard();

  useEffect(() => {
    resolveCollectionScreen(collectionId);
  }, [collectionId]);


  const collectionScreenMap = useDashboardStore((s) => s.collectionScreenMap);
  const papers = useDashboardStore((s) => s.papers);
  const screenMap = collectionScreenMap.find((csc) => csc.collectionId === collectionId);
  const overviewPapers = !screenMap
    ? []
    : papers.filter((p) => screenMap.paperIdArray.includes(p.paperId));

  return (
    <DashboardRoot ribbon={<DashboardRibbon />}>
      <DashboardContent tabs={TABS} onTabChange={setActiveTab}>
        {activeTab === "overview" && (
          <OverviewTab loading={(!screenMap || screenMap.isLoading)} papers={overviewPapers} />
        )}
        {activeTab === "members" && <MembersTab />}
        {activeTab === "settings" && <PlaceholderTab name="Settings" />}
        {activeTab === "how_to_use" && <PlaceholderTab name="How to Use" />}
      </DashboardContent>
    </DashboardRoot>
  );
}
