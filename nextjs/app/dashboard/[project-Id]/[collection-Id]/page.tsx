"use client"

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import DashboardRoot from "@/components/dashboard/dashboard-root";
import DashboardContent from "@/components/dashboard/dashboard-content";
import DashboardRibbon from "@/components/dashboard/dashboard-ribbon";
import OverviewTab from "@/components/dashboard/tabs/overview-tab";
import MembersTab from "@/components/dashboard/tabs/members-tab";
import PlaceholderTab from "@/components/dashboard/placeholder-tab";
import type { PaperWithRole } from "@/lib/api/services/papers";

const TABS = ["Overview", "Members", "Settings", "How to Use"];

export default function CollectionPage() {
  const params = useParams();
  const collectionId = params["collection-Id"] as string;
  const [activeTab, setActiveTab] = useState("overview");
  const { resolveCollectionScreen } = useDashboard();

  const [papers, setPapers] = useState<PaperWithRole[]>([]);

  useEffect(() => {
    resolveCollectionScreen(collectionId).then((d) => { if (d) setPapers(d); });
  }, [collectionId, resolveCollectionScreen]);

  return (
    <DashboardRoot ribbon={<DashboardRibbon />}>
      <DashboardContent tabs={TABS} onTabChange={setActiveTab}>
        {activeTab === "overview" && (
          <OverviewTab loading={!papers.length} papers={papers} />
        )}
        {activeTab === "members" && <MembersTab />}
        {activeTab === "settings" && <PlaceholderTab name="Settings" />}
        {activeTab === "how_to_use" && <PlaceholderTab name="How to Use" />}
      </DashboardContent>
    </DashboardRoot>
  );
}
