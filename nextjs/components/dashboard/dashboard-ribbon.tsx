"use client"

import { useEffect } from "react";
import { useRouter, useSelectedLayoutSegments } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useDashboard, useDashboardStore } from "@/components/dashboard/dashboard-provider";
import EntitySelector from "@/components/dashboard/entity-selector";
import ContainerLogo from "@/components/container-logo";
import { RibbonItemSkeleton } from "@/components/dashboard/ribbon-item";

export default function DashboardRibbon() {
  const segments = useSelectedLayoutSegments();
  const router = useRouter();
  const projectId = segments[0];
  const collectionId = segments[1];

  const { setWorkspaceId, resolveWorkspaceScreen, resolveProjectScreen, getProjectById, getCollectionById } = useDashboard();

  const activeWorkspace = useDashboardStore((s) => s.activeWorkspace);
  const availableWorkspaces = useDashboardStore((s) => s.availableWorkspaces);
  const projects = useDashboardStore((s) => s.projects);
  const collections = useDashboardStore((s) => s.collections);
  const workspaceScreenMap = useDashboardStore((s) => s.workspaceScreenMap);
  const projectScreenMapArr = useDashboardStore((s) => s.projectScreenMap);

  useEffect(() => {
    if (projectId) {
      getProjectById(projectId);
      resolveProjectScreen(projectId);
      if (!collectionId) {
        resolveWorkspaceScreen();
      }
    }
    if (collectionId) {
      getCollectionById(collectionId);
    }
  }, [projectId, collectionId]);

  const activeProject = projectId ? projects.find((p) => p.projectId === projectId) ?? null : null;
  const activeCollection = collectionId ? collections.find((c) => c.collectionId === collectionId) ?? null : null;

  const siblingProjects = workspaceScreenMap
    ? projects.filter((p) => workspaceScreenMap.projectIdArray.includes(p.projectId))
    : [];

  const siblingCollections = (() => {
    if (!projectId) return [];
    const map = projectScreenMapArr.find((m) => m.projectId === projectId);
    if (!map) return [];
    return collections.filter((c) => map.collectionIdArray.includes(c.collectionId));
  })();

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
