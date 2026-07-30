import { Skeleton } from "@/components/ui/skeleton";
import type { ProjectWithRole, CollectionWithRole, PaperWithRole } from "@/lib/api/services/dashboard";
import DashboardCreateButton from "../create-popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FilePlusCornerIcon, FilePlusIcon, FolderIcon, LayoutGridIcon, ListIcon, RotateCcw, StickyNoteIcon } from "lucide-react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";

interface OverviewTabProps {
  loading?: boolean;
  projects?: ProjectWithRole[];
  collections?: CollectionWithRole[];
  papers?: PaperWithRole[];
}

function OverviewTabSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export default function OverviewTab({ loading = false, projects = [], collections = [], papers = [] }: OverviewTabProps) {
  if (loading) return <OverviewTabSkeleton />;

  return (
    <div className="p-4 space-y-6">
      <div className="flex gap-2 items-center justify-end">
        <div className="border flex gap-1 p-[3px] h-fit rounded-sm">
          <Button size="icon" className="rounded-xs" variant="secondary"><LayoutGridIcon /></Button>
          <Button size="icon" className="rounded-xs" variant="ghost"><ListIcon /></Button>
        </div>
        <Input className="md:w-[300px] h-[40px]" />
        <DashboardCreateButton />
      </div>


      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="w-full min-h-[500px] bg-[red]">
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
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>
            <StickyNoteIcon /> New paper
          </ContextMenuItem>
          <ContextMenuItem>
            <FolderIcon /> New project
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem>
            <RotateCcw /> Reload
          </ContextMenuItem>
          <ContextMenuItem>
            <FilePlusCornerIcon /> Import paper
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>



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
