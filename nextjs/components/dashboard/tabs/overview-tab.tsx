"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProjectWithRole, CollectionWithRole, PaperWithRole } from "@/lib/api/services/dashboard";
import DashboardCreateButton from "../create-popover";
import CreateProjectDialog from "../create-project-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FilePlusCornerIcon, FolderIcon, LayoutGridIcon, ListIcon, RotateCcw, StickyNoteIcon } from "lucide-react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import FolderVisuals from "@/components/ui/folders/folderVisuals";
import ProjectCard from "@/components/ui/folders/ProjectCard";
import { Label } from "@/components/ui/label";

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
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  if (loading) return <OverviewTabSkeleton />;
  console.log("proojects: ", projects)
  return (
    <div className="p-4 space-y-6">
      <div className="flex gap-2 items-center justify-end">
        <div className="border flex gap-1 p-[3px] h-fit rounded-sm">
          <Button size="icon" className="rounded-xs" variant="secondary"><LayoutGridIcon /></Button>
          <Button size="icon" className="rounded-xs" variant="ghost"><ListIcon /></Button>
        </div>
        <Input className="md:w-[300px] h-10 sm:h-10" />
        <DashboardCreateButton onCreateProject={() => setCreateProjectOpen(true)} />
      </div>

      <CreateProjectDialog open={createProjectOpen} onClose={() => setCreateProjectOpen(false)} />


      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="w-full min-h-[500px]">
            {projects?.length > 0 && (
              <div>
                <Label>Projects</Label>
                <div className="grid grid-cols-4">
                  {projects.map((project, index) => (
                    <ProjectCard key={index} logoUrl={project.data.logoUrl || ""} folderName={project.data.name} timeAgo="20" />
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
          <ContextMenuItem onClick={() => setCreateProjectOpen(true)}>
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
            {projects.map((project, index) => (
              <div
                key={index}
                className="border rounded-md p-3 hover:bg-muted/50 cursor-pointer"
              >
                <p className="font-medium">{project.data.name}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.data.description}
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
            {collections.map((collection, index) => (
              <div
                key={index}
                className="border rounded-md p-3 hover:bg-muted/50 cursor-pointer"
              >
                <p className="font-medium">{collection.data.name}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {collection.data.description}
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
            {papers.map((paper, index) => (
              <div
                key={index}
                className="border rounded-md p-3 hover:bg-muted/50 cursor-pointer"
              >
                <p className="font-medium">{paper.data.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
