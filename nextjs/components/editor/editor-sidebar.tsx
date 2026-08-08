"use client";

import { useEffect, useState } from "react";
import type { Paper } from "@/shared/types";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { useDashboardStore } from "@/lib/zustand/store";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import EntitySelector from "@/components/dashboard/entity-selector";
import CreateProjectDialog from "@/components/dashboard/create-project-dialog";
import EditorFileTree from "./editor-filetree";

export default function EditorSidebar({ paper }: { paper?: Paper }) {
  const { setWorkspaceId, resolveWorkspaceScreen, resolveAvailableWorkspaces } = useDashboard();

  const activeWorkspace = useDashboardStore((s) => s.activeWorkspace);
  const workspaceId = activeWorkspace?.workspaceId;
  const availableWorkspacesMap = useDashboardStore((s) => s.availableWorkspacesMap);
  const workspaces = useDashboardStore((s) => s.workspaces);

  const availableWorkspaces = workspaces.filter((w) =>
    availableWorkspacesMap.workspaceIds.includes(w.workspaceId),
  );

  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    resolveWorkspaceScreen();
  }, [workspaceId]);

  useEffect(() => {
    if (activeWorkspace) {
      resolveAvailableWorkspaces();
    }
  }, [activeWorkspace]);

  return (
    <>
      <div className="flex items-center justify-between px-2 py-1">
        <EntitySelector
          imageUrl={null}
          entity={activeWorkspace}
          entityType="workspace"
          items={availableWorkspaces}
          onSelect={(entity) => setWorkspaceId(entity.workspaceId)}
          disabled={availableWorkspaces.length === 0}
        />
        <Button variant="ghost" size="icon-sm" onClick={() => setCreateProjectOpen(true)}>
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>

      <EditorFileTree paper={paper} />

      <CreateProjectDialog open={createProjectOpen} onClose={() => setCreateProjectOpen(false)} />
    </>
  );
}
