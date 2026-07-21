"use client";

import { AlertTriangle } from "lucide-react";

export default function NoWorkspace() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <AlertTriangle size={48} className="text-muted-foreground" />
      <div className="text-center">
        <h2 className="text-lg font-medium">No workspaces available</h2>
        <p className="text-muted-foreground text-sm mt-1">
          You don&apos;t have access to any workspaces. Please contact your
          workspace owner.
        </p>
      </div>
    </div>
  );
}
