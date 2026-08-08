"use client";

import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { useDashboardStore } from "@/lib/zustand/store";
import type { ProjectScreenMap } from "@/lib/zustand/store";
import { ChevronRight, FolderIcon, FileTextIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonGroup() {
  return (<div className="py-1 space-y-1">
    <Skeleton className="h-4 rounded-xs w-[90%]" />
    <Skeleton className="h-4 rounded-xs w-[90%]" />
    <Skeleton className="h-4 rounded-xs w-[90%]" />
  </div>);
}

export function FileNode({ name, depth }: { name: string; depth: number }) {
  return (
    <div
      className="flex items-center gap-1.5 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-sm select-none"
      style={{ paddingLeft: depth * 25 }}
    >
      <div className="w-3.5 shrink-0" />
      <FileTextIcon className="h-4 w-4 shrink-0" />
      <span className="truncate min-w-0">{name}</span>
    </div>
  );
}

export function FolderNode({
  entityId,
  entityType,
  depth,
  expanded,
  onToggle,
}: {
  entityId: string;
  entityType: "project" | "collection";
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  const { resolveProjectScreen, resolveCollectionScreen } = useDashboard();

  const entity = entityType === "project"
    ? useDashboardStore((s) => s.projects.find((p) => p.data.projectId === entityId))
    : useDashboardStore((s) => s.collections.find((c) => c.data.collectionId === entityId));

  const screenMap = entityType === "project"
    ? useDashboardStore((s) => s.projectScreenMap.find((m) => m.projectId === entityId))
    : useDashboardStore((s) => s.collectionScreenMap.find((m) => m.collectionId === entityId));

  const papers = useDashboardStore((s) => s.papers);

  if (!entity) return null;

  const name = entity.data.name;
  const isExpanded = expanded.has(entityId);

  function handleClick() {
    if (!isExpanded) {
      onToggle(entityId);
      if (entityType === "project") resolveProjectScreen(entityId);
      else resolveCollectionScreen(entityId);
    } else {
      onToggle(entityId);
    }
  }

  function renderChildren() {
    if (!screenMap) return null;

    if (screenMap.isLoading && screenMap.lastFetched === 0) {
      return (
        <div style={{ paddingLeft: (depth + 1) * 25 }}>
          <SkeletonGroup />
        </div>
      );
    }

    if (entityType === "project") {
      const psm = screenMap as ProjectScreenMap;
      return (
        <>
          {psm.collectionIdArray.map((collectionId) => (
            <FolderNode
              key={collectionId}
              entityId={collectionId}
              entityType="collection"
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
          {psm.paperIdArray.map((paperId) => {
            const p = papers.find((px) => px.data.paperId === paperId);
            if (!p) return null;
            return <FileNode key={paperId} name={p.data.title} depth={depth + 1} />;
          })}
        </>
      );
    }

    return screenMap.paperIdArray.map((paperId) => {
      const p = papers.find((px) => px.data.paperId === paperId);
      if (!p) return null;
      return <FileNode key={paperId} name={p.data.title} depth={depth + 1} />;
    });
  }

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-sm select-none cursor-pointer"
        style={{ paddingLeft: depth * 25 }}
        onClick={handleClick}
      >
        <ChevronRight
          className={cn("h-3.5 w-3.5 shrink-0 transition-transform", isExpanded && "rotate-90")}
        />
        <FolderIcon className="h-4 w-4 shrink-0" />
        <span className="truncate min-w-0">{name}</span>
      </div>
      {isExpanded && renderChildren()}
    </div>
  );
}
