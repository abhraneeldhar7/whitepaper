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
  PaperWithRole,
  ProjectWithRole,
  CollectionWithRole,
} from "@/lib/api/services/dashboard";

const TABS = ["Overview", "Members", "Settings", "How to Use"];

export default function CollectionPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params["collection-Id"] as string;
  const projectId = params["project-Id"] as string;
  const [activeTab, setActiveTab] = useState("overview");
  const { resolveCollectionScreen, resolveProjectScreen, getProjectById, getCollectionById } = useDashboard();

  const [papers, setPapers] = useState<PaperWithRole[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectWithRole | null>(null);
  const [activeCollection, setActiveCollection] = useState<CollectionWithRole | null>(null);
  const [siblingCollections, setSiblingCollections] = useState<CollectionWithRole[]>([]);

  useEffect(() => {
    resolveCollectionScreen(collectionId).then((d) => { if (d) setPapers(d); });
    getProjectById(projectId).then(setActiveProject);
    getCollectionById(collectionId).then(setActiveCollection);
    resolveProjectScreen(projectId).then((d) => { if (d) setSiblingCollections(d.collections); });
  }, [collectionId, projectId, resolveCollectionScreen, getProjectById, getCollectionById, resolveProjectScreen]);

  let ribbon;
  if (activeProject && activeCollection) {
    ribbon = (
      <div className="flex items-center gap-0.5">
        <ContainerLogo imageUrl={activeProject.logoUrl} name={activeProject.name} size={24} />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <EntitySelector
          imageUrl={null}
          entity={{ id: activeCollection.collectionId, name: activeCollection.name }}
          entityType="collection"
          items={siblingCollections.map((c) => ({ id: c.collectionId, name: c.name }))}
          onSelect={(id) => router.push(`/dashboard/${projectId}/${id}`)}
          disabled={!papers}
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
          <OverviewTab loading={!papers.length && !activeProject} papers={papers} />
        )}
        {activeTab === "members" && <MembersTab />}
        {activeTab === "settings" && <PlaceholderTab name="Settings" />}
        {activeTab === "how_to_use" && <PlaceholderTab name="How to Use" />}
      </DashboardContent>
    </DashboardRoot>
  );
}
