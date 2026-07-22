"use client"

import type { ReactNode } from "react";
import { useDashboardStore } from "@/lib/zustand/store";
import UserAvatar from "@/components/userAvatar";
import { RibbonItem, RibbonItemSkeleton } from "./ribbon-item";
import NoWorkspace from "./no-workspace";

export default function DashboardRoot({ children }: { children: ReactNode }) {
  const workspace = useDashboardStore((s) => s.workspace);
  const isLoading = useDashboardStore((s) => s.isLoading);
  const error = useDashboardStore((s) => s.error);

  return (
    <div className="w-full h-full min-h-screen flex flex-col bg-muted">
      <div className="flex justify-between items-center p-3 md:p-4">
        {isLoading ? (
          <RibbonItemSkeleton />
        ) : error || !workspace ? (
          <div className="flex gap-3 items-center" />
        ) : (
          <RibbonItem
            logo={null}
            name={workspace.workspaceName}
            chevron="down"
          />
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
