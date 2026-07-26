import { apiClient, type ApiClient } from "@/lib/api/api-client";
import { PRIVATE } from "@/lib/api/endpoints";
import type { Project, Collection } from "@/lib/types";
import type { PaperWithRole } from "@/lib/api/services/workspace";

export interface ProjectWithRole extends Project {
  role: string;
}

export interface CollectionWithRole extends Collection {
  role: string;
}

export interface ProjectScreenData {
  collections: CollectionWithRole[];
  papers: PaperWithRole[];
}

export function fetchProjectScreen(
  projectId: string,
  client: ApiClient = apiClient,
): Promise<ProjectScreenData> {
  return client.get<ProjectScreenData>(PRIVATE.SCREEN_PROJECT, {
    query: { projectId },
  });
}

export function fetchProjectById(
  projectId: string,
  client: ApiClient = apiClient,
): Promise<ProjectWithRole | null> {
  return client.get<ProjectWithRole | null>(
    PRIVATE.PROJECT_BY_ID,
    { query: { projectId } },
  );
}
