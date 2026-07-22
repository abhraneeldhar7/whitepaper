"use client"

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import DashboardRoot from "@/components/dashboard/dashboard-root";
import ProjectContent from "@/components/dashboard/tabs/project-content";

function ProjectLoader() {
  const params = useParams();
  const projectId = params["project-Id"] as string;
  const { loadCollections, loadProjectPapers } = useDashboard();

  useEffect(() => {
    if (projectId) {
      loadCollections(projectId);
      loadProjectPapers(projectId);
    }
  }, [projectId, loadCollections, loadProjectPapers]);

  return null;
}

export default function ProjectPage() {
  return (
    <>
      <ProjectLoader />
      <DashboardRoot>
        <ProjectContent />
      </DashboardRoot>
    </>
  );
}
