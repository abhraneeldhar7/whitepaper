"use client"

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useDashboard, useDashboardStore } from "@/components/dashboard/dashboard-provider";
import DashboardRoot from "@/components/dashboard/dashboard-root";
import DashboardContent from "@/components/dashboard/dashboard-content";
import OverviewTab from "@/components/dashboard/tabs/overview-tab";
import MembersTab from "@/components/dashboard/tabs/members-tab";
import PlaceholderTab from "@/components/dashboard/placeholder-tab";
import type { CollectionWithRole, PaperWithRole } from "@/lib/api/services/dashboard";

const TABS = ["Overview", "Members", "Settings", "How to Use"];

export default function ProjectPage() {
  const params = useParams();
  const projectId = params["project-Id"] as string;
  const [activeTab, setActiveTab] = useState("overview");
  const { resolveProjectScreen } = useDashboard();
  const [collections, setCollections] = useState<CollectionWithRole[]>([]);
  const [papers, setPapers] = useState<PaperWithRole[]>([]);

  const psm = useDashboardStore((s) =>
    s.projectScreenMap.find((x) => x.projectId === projectId)
  );
  const loading = !psm || psm.isLoading;

  useEffect(() => {
    resolveProjectScreen(projectId).then((data) => {
      if (data) {
        setCollections(data.collections);
        setPapers(data.papers);
      }
    });
  }, [projectId]);

  return (
    <DashboardRoot>
      <DashboardContent tabs={TABS} onTabChange={setActiveTab}>
        {activeTab === "overview" && (
          <OverviewTab
            loading={loading}
            collections={collections}
            papers={papers}
          />
        )}
        {activeTab === "members" && <MembersTab />}
        {activeTab === "settings" && <PlaceholderTab name="Settings" />}
        {activeTab === "how_to_use" && <PlaceholderTab name="How to Use" />}
      </DashboardContent>
    </DashboardRoot>
  );
}
