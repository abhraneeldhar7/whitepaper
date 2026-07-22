import { useDashboardStore } from "@/lib/zustand/store";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProjectWithRole, CollectionWithRole, PaperWithRole } from "@/lib/api/services/dashboard";

function OverviewTabLoading() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

interface OverviewTabProps {
  projects?: ProjectWithRole[];
  collections?: CollectionWithRole[];
  papers?: PaperWithRole[];
}

export default function OverviewTab({ projects = [], collections = [], papers = [] }: OverviewTabProps) {
  const isLoading = useDashboardStore((s) => s.isLoading);

  if (isLoading) return <OverviewTabLoading />;

  return (
    <div className="p-4 space-y-6">
      {projects.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Projects</h3>
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
        </div>
      )}
      {collections.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Collections</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {collections.map((collection) => (
              <div
                key={collection.collectionId}
                className="border rounded-md p-3 hover:bg-muted/50 cursor-pointer"
              >
                <p className="font-medium">{collection.name}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {collection.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      {papers.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Papers</h3>
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
        </div>
      )}
    </div>
  );
}
