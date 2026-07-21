import { Suspense } from "react";
import UserAvatar from "@/components/userAvatar";
import { Button } from "@/components/ui/button";
import { DashboardProvider, useDashboard } from "@/components/dashboard/dashboard-provider";
import WorkspaceSelector from "@/components/dashboard/workspace-selector";
import TabsNavigation from "@/components/dashboard/tabs-navigation";
import DashboardContent from "@/components/dashboard/dashboard-content";
import NoWorkspace from "@/components/dashboard/no-workspace";

function DashboardInner() {
  const { workspace, loading, error } = useDashboard();

  if (loading) {
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

  if (error || !workspace) {
    return (
      <div className="w-full h-full min-h-screen flex flex-col bg-muted">
        <div className="flex justify-between items-center p-3 md:p-4">
          <div className="flex gap-3 items-center" />
          <UserAvatar />
        </div>
        <NoWorkspace />
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
          <div className="flex-1 overflow-auto">
            <DashboardContent />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardProvider>
        <DashboardInner />
      </DashboardProvider>
    </Suspense>
  );
}
