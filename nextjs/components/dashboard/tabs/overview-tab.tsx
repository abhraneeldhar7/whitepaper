"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProjectWithRole, CollectionWithRole, PaperWithRole } from "@/lib/api/services/dashboard";
import { timeAgo } from "@/lib/time";
import DashboardCreateButton from "../create-popover";
import CreateProjectDialog from "../create-project-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FilePlusCornerIcon, FingerprintIcon, FolderIcon, LayoutGridIcon, ListIcon, MouseRightIcon, RotateCcw, StickyNoteIcon } from "lucide-react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import ProjectCard from "@/components/ui/folders/ProjectCard";
import { Label } from "@/components/ui/label";
import FolderCard from "@/components/ui/folders/FolderCard";
import PaperVisual from "@/components/ui/folders/PaperVisual";

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
    <div className="p-4 space-y-4">
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
          <div className="min-h-[500px] relative">

            <div className="inset-0 absolute z-[2] bg-primary/10 flex items-center justify-center rounded-lg">
              <p className="text-md flex items-center">
                <span className="md:hidden inline-flex items-center mr-1"><FingerprintIcon className="inline opacity-70 mr-1" size={20} /> Tap and hold</span>
                <span className="hidden md:inline-flex items-center mr-1"><MouseRightIcon className="inline opacity-70 mr-1" size={20} /> Right click</span>
                for menu</p>
            </div>

            {projects?.length > 0 && (
              <div className="space-y-3">
                <Label className="text-md">Projects</Label>
                <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fit,_minmax(200px,_1fr))] gap-4 md:gap-10">
                  {projects.map((project, index) => (
                    <div key={index} className="flex md:block items-center justify-center">
                      <ProjectCard logoUrl={project.data.logoUrl || ""} folderName={project.data.name} timeAgo={`${timeAgo(project.data.updatedAt).value}${timeAgo(project.data.updatedAt).unit}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {collections?.length > 0 && (
              <div className="space-y-3 mt-5">
                <Label className="text-md">Collections</Label>
                <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fit,_minmax(200px,_1fr))] gap-4 md:gap-10">
                  {collections.map((collection, index) => (
                    <div key={index} className="flex md:block items-center justify-center">
                      <FolderCard />
                    </div>))}
                </div>
              </div>
            )}
            {papers?.length > 0 && (
              <div className="space-y-3 mt-5">
                <Label className="text-md">Papers</Label>
                <div className="grid grid-cols-2 md:grid-cols-[repeat(auto-fit,_minmax(200px,_1fr))] gap-4 md:gap-10">
                  {papers.map((paper, index) => (
                    <div key={index} className="flex md:block items-center justify-center">
                      <PaperVisual />
                    </div>))}
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
    </div>
  );
}
