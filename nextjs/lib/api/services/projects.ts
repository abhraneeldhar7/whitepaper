import { apiClient, type ApiClient } from "@/lib/api/api-client";
import { PRIVATE } from "@/lib/api/endpoints";
import type { Project, Collection } from "@/shared/types";
import type { PaperWithRole } from "@/lib/api/services/workspace";

export interface ProjectWithRole {
  role: string;
  data: Project;
}

export interface CollectionWithRole {
  role: string;
  data: Collection;
}

export interface ProjectScreenData {
  collections: CollectionWithRole[];
  papers: PaperWithRole[];
}

export interface CreateProjectResponse {
  role: string;
  data: Project;
}

export function createProject(
  formData: FormData,
  client: ApiClient = apiClient,
): Promise<CreateProjectResponse> {
  return client.post<CreateProjectResponse>(PRIVATE.PROJECT_CREATE, { body: formData });
}

export function checkProjectSlug(
  workspaceId: string,
  slug: string,
  projectId?: string,
  client: ApiClient = apiClient,
): Promise<{ available: boolean }> {
  const query: Record<string, string> = { workspaceId, slug };
  if (projectId) query.projectId = projectId;
  return client.get<{ available: boolean }>(PRIVATE.PROJECT_CHECK_SLUG, { query });
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
  return client.get<{ role: string; data: Project } | null>(
    PRIVATE.PROJECT_BY_ID + "/" + projectId,
  );
}

export function getProjectBySlug(
  workspaceId: string,
  slug: string,
  client: ApiClient = apiClient,
): Promise<ProjectWithRole | null> {
  return client.get<{ role: string; data: Project } | null>(
    PRIVATE.PROJECT_BY_SLUG + "/" + slug,
    { query: { workspaceId } },
  );
}
