"use client";

import { Suspense, useEffect } from "react";
import { useParams } from "next/navigation";
import UserAvatar from "@/components/userAvatar";
import {
  DashboardProvider,
  useDashboard,
  useDashboardStore,
} from "@/components/dashboard/dashboard-provider";
import WorkspaceSelector from "@/components/dashboard/workspace-selector";
import TabsNavigation from "@/components/dashboard/tabs-navigation";

function CollectionInner() {
  const params = useParams();
  const projectId = params["project-Id"] as string;
  const collectionId = params["collection-Id"] as string;
  const { loadCollections, loadCollectionPapers } = useDashboard();
  const workspace = useDashboardStore((s) => s.workspace);
  const isLoading = useDashboardStore((s) => s.isLoading);
  const projects = useDashboardStore((s) => s.projects);
  const collections = useDashboardStore((s) => s.collections);
  const papers = useDashboardStore((s) => s.papers);

  const project = projects.find((p) => p.projectId === projectId);
  const collection = collections.find((c) => c.collectionId === collectionId);

  useEffect(() => {
    if (projectId && collections.length === 0) {
      loadCollections(projectId);
    }
    if (collectionId) {
      loadCollectionPapers(collectionId);
    }
  }, [projectId, collectionId, loadCollections, loadCollectionPapers, collections.length]);

  if (isLoading) {
    return (
      <div className="w-full h-full min-h-screen flex flex-col bg-muted">
        <div className="flex justify-between items-center p-3 md:p-4">
          <div className="flex gap-3 items-center">
            <div className="h-[30px] w-[30px] rounded-sm bg-muted-foreground/20 animate-pulse" />
            <div className="h-4 w-32 bg-muted-foreground/20 rounded animate-pulse" />
          </div>
          <UserAvatar />
        </div>
        <div className="p-1 md:p-2 pt-0 md:pt-0 w-full h-full flex-1 flex flex-col">
          <div className="border rounded-md bg-background w-full h-full flex-1">
            <div className="border-b w-full p-2 flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-16 bg-muted-foreground/10 rounded animate-pulse" />
              ))}
            </div>
            <div className="p-4 space-y-4">
              <div className="h-8 w-48 bg-muted-foreground/10 rounded animate-pulse" />
              <div className="h-32 w-full bg-muted-foreground/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!workspace || !project || !collection) {
    return (
      <div className="w-full h-full min-h-screen flex flex-col bg-muted">
        <div className="flex justify-between items-center p-3 md:p-4">
          <div className="flex gap-3 items-center" />
          <UserAvatar />
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Collection not found
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-screen flex flex-col bg-muted">
      <div className="flex justify-between items-center p-3 md:p-4">
        <WorkspaceSelector />
        <div className="flex">
          <UserAvatar />
        </div>
      </div>

      <div className="p-1 md:p-2 pt-0 md:pt-0 w-full h-full flex-1 flex flex-col">
        <div className="border rounded-md bg-background w-full h-full flex-1 flex flex-col">
          <TabsNavigation />
          <div className="flex-1 overflow-auto p-4">
            <div className="text-sm text-muted-foreground mb-1">
              {project.name}
            </div>
            <h2 className="text-lg font-semibold mb-4">{collection.name}</h2>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Papers</h3>
              {papers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No papers</p>
              ) : (
                papers.map((p) => (
                  <div key={p.paperId} className="border rounded p-3">
                    {p.title}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CollectionPage() {
  return (
    <Suspense>
      <DashboardProvider>
        <CollectionInner />
      </DashboardProvider>
    </Suspense>
  );
}
