"use client"

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import DashboardRoot from "@/components/dashboard/dashboard-root";
import CollectionContent from "@/components/dashboard/tabs/collection-content";

function CollectionLoader() {
  const params = useParams();
  const projectId = params["project-Id"] as string;
  const collectionId = params["collection-Id"] as string;
  const { loadCollections, loadCollectionPapers } = useDashboard();

  useEffect(() => {
    if (projectId) {
      loadCollections(projectId);
    }
    if (collectionId) {
      loadCollectionPapers(collectionId);
    }
  }, [projectId, collectionId, loadCollections, loadCollectionPapers]);

  return null;
}

export default function CollectionPage() {
  return (
    <>
      <CollectionLoader />
      <DashboardRoot>
        <CollectionContent />
      </DashboardRoot>
    </>
  );
}
