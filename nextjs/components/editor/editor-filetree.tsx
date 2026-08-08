"use client";

import { useEffect, useState } from "react";
import type { Paper } from "@/shared/types";
import { useDashboardStore } from "@/lib/zustand/store";
import { FolderNode, FileNode, SkeletonGroup } from "./filetree";

export default function EditorFileTree({ paper }: { paper?: Paper }) {
  const wsm = useDashboardStore((s) => s.workspaceScreenMap);
  const projects = useDashboardStore((s) => s.projects);
  const papers = useDashboardStore((s) => s.papers);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!paper) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      if (paper.projectId) next.add(paper.projectId);
      if (paper.collectionId) next.add(paper.collectionId);
      return next;
    });
  }, [paper?.paperId]);

  function handleToggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (!wsm || (wsm.isLoading && wsm.lastFetched === 0)) {
    return (
      <div className="px-2 py-3">
        <SkeletonGroup />
      </div>
    );
  }

  return (
    <div className="px-2 py-3">
      {wsm.projectIdArray.map((projectId) => {
        const project = projects.find((p) => p.data.projectId === projectId);
        if (!project) return null;
        return (
          <FolderNode
            key={projectId}
            entityId={projectId}
            entityType="project"
            depth={0}
            expanded={expanded}
            onToggle={handleToggle}
          />
        );
      })}
      {wsm.paperIdArray.map((paperId) => {
        const p = papers.find((px) => px.data.paperId === paperId);
        if (!p) return null;
        return <FileNode key={paperId} name={p.data.title} depth={0} />;
      })}
    </div>
  );
}
