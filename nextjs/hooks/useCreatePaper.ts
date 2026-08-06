"use client";

import { useRouter } from "next/navigation";
import { createPaper } from "@/lib/api/services/papers";
import { useDashboardStore } from "@/lib/zustand/store";

export function useCreatePaper() {
  const router = useRouter();

  return async (workspaceId: string | undefined, projectId: string | null = null, collectionId: string | null = null) => {
    if (!workspaceId) return;
    router.push("/p/new");
    const result = await createPaper(workspaceId, projectId, collectionId);
    if (result) {
      useDashboardStore.getState().upsertToPapers([result]);
      window.history.replaceState(null, "", `/p/${result.data.publicSlug}`);
    }
  };
}
