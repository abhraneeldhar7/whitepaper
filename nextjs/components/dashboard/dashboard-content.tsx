"use client";

import { useSearchParams } from "next/navigation";
import { useDashboard } from "./dashboard-provider";
import { Skeleton } from "@/components/ui/skeleton";

function OverviewTab() {
  const { papers, projects } = useDashboard();

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-3">Projects</h3>
        {projects.length === 0 ? (
          <p className="text-muted-foreground text-sm">No projects yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map((project) => (
              <div
                key={project.projectId}
                className="border rounded-md p-3 hover:bg-muted/50 cursor-pointer"
              >
                <p className="font-medium">{project.name}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-lg font-medium mb-3">Papers</h3>
        {papers.length === 0 ? (
          <p className="text-muted-foreground text-sm">No papers yet.</p>
        ) : (
          <div className="space-y-2">
            {papers.map((paper) => (
              <div
                key={paper.paperId}
                className="border rounded-md p-3 hover:bg-muted/50 cursor-pointer"
              >
                <p className="font-medium">{paper.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PlaceholderTab({ name }: { name: string }) {
  return (
    <div className="p-4">
      <p className="text-muted-foreground">{name} content coming soon.</p>
    </div>
  );
}

export default function DashboardContent() {
  const searchParams = useSearchParams();
  const { loading } = useDashboard();
  const activeTab = searchParams.get("tab") || "overview";

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  switch (activeTab) {
    case "overview":
      return <OverviewTab />;
    case "projects":
      return <PlaceholderTab name="Projects" />;
    case "papers":
      return <PlaceholderTab name="Papers" />;
    case "settings":
      return <PlaceholderTab name="Settings" />;
    default:
      return <OverviewTab />;
  }
}
