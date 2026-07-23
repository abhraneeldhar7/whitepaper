"use client"

import type { ReactNode } from "react";
import { useDashboardStore } from "@/lib/zustand/store";
import WorkspaceRibbonButton from "./workspace-ribbon-button";
import { RibbonItemSkeleton } from "./ribbon-item";
import UserPopover from "../userPopover";

export default function DashboardRoot({ children }: { children: ReactNode }) {
  const wsm = useDashboardStore((s) => s.workspaceScreenMap);
  const activeWorkspace = useDashboardStore((s) => s.activeWorkspace);

  return (
    <div className="w-full h-full min-h-screen flex flex-col bg-muted">
      <div className="flex justify-between items-center p-3 md:p-4">
        {!wsm ? <RibbonItemSkeleton /> : activeWorkspace ? <WorkspaceRibbonButton /> : <div className="flex gap-3 items-center" />}
        <UserPopover />
      </div>
      {children}
    </div>
  );
}
