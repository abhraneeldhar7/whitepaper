"use client"

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useDashboard, useDashboardStore } from "@/components/dashboard/dashboard-provider";
import DashboardRoot from "@/components/dashboard/dashboard-root";
import DashboardContent from "@/components/dashboard/dashboard-content";
import EntitySelector from "@/components/dashboard/entity-selector";
import ContainerLogo from "@/components/container-logo";
import { RibbonItemSkeleton } from "@/components/dashboard/ribbon-item";
import OverviewTab from "@/components/dashboard/tabs/overview-tab";
import MembersTab from "@/components/dashboard/tabs/members-tab";
import PlaceholderTab from "@/components/dashboard/placeholder-tab";
import type {
  CollectionWithRole,
  PaperWithRole,
  ProjectWithRole,
} from "@/lib/api/services/dashboard";

const TABS = ["Overview", "Members", "Settings", "How to Use"];

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params["project-Id"] as string;
  const [activeTab, setActiveTab] = useState("overview");
  const { resolveProjectScreen, resolveWorkspaceScreen, getProjectById } = useDashboard();

  const activeWorkspace = useDashboardStore((s) => s.activeWorkspace);

  const [data, setData] = useState<{ collections: CollectionWithRole[]; papers: PaperWithRole[] } | null>(null);
  const [activeProject, setActiveProject] = useState<ProjectWithRole | null>(null);
  const [siblingProjects, setSiblingProjects] = useState<ProjectWithRole[]>([]);

  useEffect(() => {
    resolveProjectScreen(projectId).then((d) => setData(d ?? null));
    getProjectById(projectId).then(setActiveProject);
  }, [projectId, resolveProjectScreen, getProjectById]);

  useEffect(() => {
    if (!activeWorkspace?.workspaceId) return;
    resolveWorkspaceScreen().then((d) => { if (d) setSiblingProjects(d.projects); });
  }, [activeWorkspace?.workspaceId, resolveWorkspaceScreen]);

  let ribbon;
  if (activeWorkspace && activeProject) {
    ribbon = (
      <div className="flex items-center gap-0.5">
        <ContainerLogo imageUrl={null} name={activeWorkspace.workspaceName} size={24} />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <EntitySelector
          imageUrl={activeProject.logoUrl}
          entity={{ id: activeProject.projectId, name: activeProject.name, logoUrl: activeProject.logoUrl }}
          entityType="project"
          items={siblingProjects.map((p) => ({ id: p.projectId, name: p.name, logoUrl: p.logoUrl }))}
          onSelect={(id) => router.push(`/dashboard/${id}`)}
          disabled={!data}
        />
      </div>
    );
  } else {
    ribbon = <RibbonItemSkeleton />;
  }

  return (
    <DashboardRoot ribbon={ribbon}>
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
