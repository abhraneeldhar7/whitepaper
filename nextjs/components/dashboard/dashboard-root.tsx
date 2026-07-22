"use client"

import type { ReactNode } from "react";
import { useDashboardStore } from "@/lib/zustand/store";
import UserAvatar from "@/components/userAvatar";
import WorkspaceRibbonButton from "./workspace-ribbon-button";
import { RibbonItemSkeleton } from "./ribbon-item";

export default function DashboardRoot({ children }: { children: ReactNode }) {
  const hydrated = useDashboardStore((s) => s.hydrated);
  const activeWorkspace = useDashboardStore((s) => s.activeWorkspace);

  return (
    <div className="w-full h-full min-h-screen flex flex-col bg-muted">
      <div className="flex justify-between items-center p-3 md:p-4">
        {!hydrated ? <RibbonItemSkeleton /> : activeWorkspace ? <WorkspaceRibbonButton /> : <div className="flex gap-3 items-center" />}
        <UserAvatar />
      </div>
      {children}
    </div>
  );
}
