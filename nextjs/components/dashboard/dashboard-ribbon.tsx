"use client"

import { useEffect } from "react";
import { useRouter, useSelectedLayoutSegments } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useDashboard, useDashboardStore } from "@/components/dashboard/dashboard-provider";
import EntitySelector from "@/components/dashboard/entity-selector";
import ContainerLogo from "@/components/container-logo";
import { Skeleton } from "../ui/skeleton";

function RibbonItemSkeleton() {
  return (<>
    <div className="p-1 pl-0 flex gap-2 items-center border-1 border-transparent">
      <Skeleton className="rounded-sm h-[30px] w-[30px]" />
      <Skeleton className="h-[20px] w-[120px] rounded-xs" />
    </div>
  </>)
}

export default function DashboardRibbon() {
  const segments = useSelectedLayoutSegments();
  const router = useRouter();
  const projectId = segments[0];
  const collectionId = segments[1];

  const { setWorkspaceId, resolveWorkspaceScreen, resolveProjectScreen, resolveAvailableWorkspaces } = useDashboard();

  const activeWorkspace = useDashboardStore((s) => s.activeWorkspace);
  const availableWorkspacesMap = useDashboardStore((s) => s.availableWorkspacesMap);
  const workspaces = useDashboardStore((s) => s.workspaces);
  const projects = useDashboardStore((s) => s.projects);
  const collections = useDashboardStore((s) => s.collections);
  const workspaceScreenMap = useDashboardStore((s) => s.workspaceScreenMap);
  const projectScreenMapArr = useDashboardStore((s) => s.projectScreenMap);

  const availableWorkspaces = workspaces.filter((w) => availableWorkspacesMap.workspaceIds.includes(w.workspaceId));

  useEffect(() => {
    if (projectId) {
      resolveProjectScreen(projectId);
      if (!collectionId) {
        resolveWorkspaceScreen();
      }
    }
    if (activeWorkspace) {
      resolveAvailableWorkspaces();
    }
  }, [projectId, collectionId, activeWorkspace]);

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
      <div className="flex items-center gap-2">
        <ContainerLogo imageUrl={activeProject.logoUrl} name={activeProject.name} />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <EntitySelector
          imageUrl={null}
          entity={activeCollection}
          entityType="collection"
          items={siblingCollections}
          onSelect={(entity) => router.push(`/dashboard/${entity.projectId}/${entity.collectionId}`)}
        />
      </div>
    );
  }

  if (projectId) {
    if (!activeWorkspace || !activeProject) return <RibbonItemSkeleton />;
    return (
      <div className="flex items-center gap-2">
        <ContainerLogo imageUrl={null} name={activeWorkspace.workspaceName} />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <EntitySelector
          imageUrl={activeProject.logoUrl}
          entity={activeProject}
          entityType="project"
          items={siblingProjects}
          onSelect={(entity) => router.push(`/dashboard/${entity.projectId}`)}
        />
      </div>
    );
  }

  if (!activeWorkspace) return <RibbonItemSkeleton />;
  return (
    <EntitySelector
      imageUrl={null}
      entity={activeWorkspace}
      entityType="workspace"
      items={availableWorkspaces}
      onSelect={(entity) => setWorkspaceId(entity.workspaceId)}
      disabled={availableWorkspaces.length === 0}
    />
  );
}
