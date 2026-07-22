"use client"

import type { ReactNode } from "react";
import { useDashboardStore } from "@/lib/zustand/store";
import UserAvatar from "@/components/userAvatar";
import WorkspaceRibbonButton from "./workspace-ribbon-button";
import { RibbonItemSkeleton } from "./ribbon-item";
import NoWorkspace from "./no-workspace";

export default function DashboardRoot({ children }: { children: ReactNode }) {
  const isLoading = useDashboardStore((s) => s.isLoading);
  const error = useDashboardStore((s) => s.error);
  const workspace = useDashboardStore((s) => s.workspace);

  return (
    <div className="w-full h-full min-h-screen flex flex-col bg-muted">
      <div className="flex justify-between items-center p-3 md:p-4">
        {isLoading ? (
          <RibbonItemSkeleton />
        ) : error || !workspace ? (
          <div className="flex gap-3 items-center" />
        ) : (
          <WorkspaceRibbonButton />
        )}
        <UserAvatar />
      </div>
      {isLoading ? null : error || !workspace ? (
        <NoWorkspace />
      ) : (
        children
      )}
    </div>
  );
}
