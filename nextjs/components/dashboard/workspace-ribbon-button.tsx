"use client"

import { Check, ChevronsUpDown } from "lucide-react";
import { useDashboard, useDashboardStore } from "@/components/dashboard/dashboard-provider";
import WorkspaceLogo from "@/components/workspace-logo";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function WorkspaceRibbonButton() {
  const activeWorkspace = useDashboardStore((s) => s.activeWorkspace);
  const availableWorkspaces = useDashboardStore((s) => s.availableWorkspaces);
  const { setWorkspaceId } = useDashboard();

  if (!activeWorkspace) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2 h-auto py-1.5">
          <WorkspaceLogo src={null} name={activeWorkspace.workspaceName} />
          <span className="text-base font-medium">{activeWorkspace.workspaceName}</span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-1">
        {availableWorkspaces.map((ws) => (
          <button
            key={ws.workspaceId}
            onClick={() => setWorkspaceId(ws.workspaceId)}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-sm hover:bg-muted text-left"
          >
            <WorkspaceLogo src={null} name={ws.workspaceName} size={24} />
            <span className="flex-1 text-sm truncate">{ws.workspaceName}</span>
            {ws.workspaceId === activeWorkspace.workspaceId && (
              <Check className="h-4 w-4 shrink-0" />
            )}
          </button>
        ))}
        {availableWorkspaces.length === 0 && (
          <p className="text-xs text-muted-foreground px-2 py-1.5">No other workspaces</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
