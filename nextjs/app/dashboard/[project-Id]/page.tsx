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
import type { CollectionWithRole } from "@/lib/api/services/projects";
import type { PaperWithRole } from "@/lib/api/services/papers";

const TABS = ["Overview", "Members", "Settings", "How to Use"];

export default function ProjectPage() {
  const params = useParams();
  const projectId = params["project-Id"] as string;
  const [activeTab, setActiveTab] = useState("overview");
  const { resolveProjectScreen } = useDashboard();

  const [data, setData] = useState<{ collections: CollectionWithRole[]; papers: PaperWithRole[] } | null>(null);

  useEffect(() => {
    resolveProjectScreen(projectId).then((d) => setData(d ?? null));
  }, [projectId, resolveProjectScreen]);

  return (
    <DashboardRoot ribbon={<DashboardRibbon />}>
      <DashboardContent tabs={TABS} onTabChange={setActiveTab}>
        {activeTab === "overview" && (
          <OverviewTab loading={!data} collections={data?.collections ?? []} papers={data?.papers ?? []} />
        )}
        {activeTab === "members" && <MembersTab />}
        {activeTab === "settings" && <PlaceholderTab name="Settings" />}
        {activeTab === "how_to_use" && <PlaceholderTab name="How to Use" />}
      </DashboardContent>
    </DashboardRoot>
  );
}
