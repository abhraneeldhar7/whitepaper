"use client"

import { useEffect, useState } from "react";
import { useRouter, useSelectedLayoutSegments } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useDashboard, useDashboardStore } from "@/components/dashboard/dashboard-provider";
import EntitySelector from "@/components/dashboard/entity-selector";
import ContainerLogo from "@/components/container-logo";
import { RibbonItemSkeleton } from "@/components/dashboard/ribbon-item";
import type { ProjectWithRole, CollectionWithRole } from "@/lib/api/services/projects";

export default function DashboardRibbon() {
  const segments = useSelectedLayoutSegments();
  const router = useRouter();
  const projectId = segments[0];
  const collectionId = segments[1];

  const { setWorkspaceId, resolveWorkspaceScreen, resolveProjectScreen, getProjectById, getCollectionById } = useDashboard();

  const activeWorkspace = useDashboardStore((s) => s.activeWorkspace);
  const availableWorkspaces = useDashboardStore((s) => s.availableWorkspaces);

  const [activeProject, setActiveProject] = useState<ProjectWithRole | null>(null);
  const [activeCollection, setActiveCollection] = useState<CollectionWithRole | null>(null);
  const [siblingProjects, setSiblingProjects] = useState<ProjectWithRole[]>([]);
  const [siblingCollections, setSiblingCollections] = useState<CollectionWithRole[]>([]);

  useEffect(() => {
    if (projectId) {
      getProjectById(projectId).then(setActiveProject);
      resolveProjectScreen(projectId).then((d) => { if (d) setSiblingCollections(d.collections); });
      if (!collectionId) {
        resolveWorkspaceScreen().then((d) => { if (d) setSiblingProjects(d.projects); });
      }
    }
    if (collectionId) {
      getCollectionById(collectionId).then(setActiveCollection);
    }
  }, [projectId, collectionId, getProjectById, getCollectionById, resolveProjectScreen, resolveWorkspaceScreen]);

  if (collectionId) {
    if (!activeProject || !activeCollection) return <RibbonItemSkeleton />;
    return (
      <div className="flex items-center gap-0.5">
        <ContainerLogo imageUrl={activeProject.logoUrl} name={activeProject.name} size={24} />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <EntitySelector
          imageUrl={null}
          entity={{ id: activeCollection.collectionId, name: activeCollection.name }}
          entityType="collection"
          items={siblingCollections.map((c) => ({ id: c.collectionId, name: c.name }))}
          onSelect={(id) => router.push(`/dashboard/${projectId}/${id}`)}
        />
      </div>
    );
  }

  if (projectId) {
    if (!activeWorkspace || !activeProject) return <RibbonItemSkeleton />;
    return (
      <div className="flex items-center gap-0.5">
        <ContainerLogo imageUrl={null} name={activeWorkspace.workspaceName} size={24} />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <EntitySelector
          imageUrl={activeProject.logoUrl}
          entity={{ id: activeProject.projectId, name: activeProject.name, logoUrl: activeProject.logoUrl }}
          entityType="project"
          items={siblingProjects.map((p) => ({ id: p.projectId, name: p.name, logoUrl: p.logoUrl }))}
          onSelect={(id) => router.push(`/dashboard/${id}`)}
        />
      </div>
    );
  }

  if (!activeWorkspace) return <RibbonItemSkeleton />;
  return (
    <EntitySelector
      imageUrl={null}
      entity={{ id: activeWorkspace.workspaceId, name: activeWorkspace.workspaceName }}
      entityType="workspace"
      items={availableWorkspaces.map((ws) => ({ id: ws.workspaceId, name: ws.workspaceName }))}
      onSelect={(id) => setWorkspaceId(id)}
      disabled={availableWorkspaces.length === 0}
    />
  );
}
