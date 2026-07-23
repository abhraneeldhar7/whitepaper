import { apiClient, type ApiClient } from "@/lib/api/api-client";
import { PRIVATE } from "@/lib/api/endpoints";
import type { Project, Collection, Paper, MemberWithUser } from "@/lib/types";

export interface ProjectWithRole extends Project {
  role: string;
}

export interface CollectionWithRole extends Collection {
  role: string;
}

export interface PaperWithRole extends Paper {
  role: string;
}

export function fetchDashboardProjects(
  workspaceId: string,
  client: ApiClient = apiClient,
): Promise<ProjectWithRole[]> {
  return client.get<ProjectWithRole[]>(
    `${PRIVATE.DASHBOARD_PROJECTS}?workspaceId=${workspaceId}`
  );
}

export function fetchDashboardPapers(
  workspaceId: string,
  client: ApiClient = apiClient,
): Promise<PaperWithRole[]> {
  return client.get<PaperWithRole[]>(
    `${PRIVATE.DASHBOARD_PAPERS}?workspaceId=${workspaceId}`
  );
}

export function fetchProjectCollections(
  projectId: string,
  workspaceId: string,
  client: ApiClient = apiClient,
): Promise<CollectionWithRole[]> {
  return client.get<CollectionWithRole[]>(
    `${PRIVATE.PROJECT_COLLECTIONS}/${projectId}/collections?workspaceId=${workspaceId}`
  );
}

export function fetchProjectPapers(
  projectId: string,
  workspaceId: string,
  client: ApiClient = apiClient,
): Promise<PaperWithRole[]> {
  return client.get<PaperWithRole[]>(
    `${PRIVATE.PROJECT_PAPERS}/${projectId}/papers?workspaceId=${workspaceId}`
  );
}

export function fetchCollectionPapers(
  collectionId: string,
  workspaceId: string,
  client: ApiClient = apiClient,
): Promise<PaperWithRole[]> {
  return client.get<PaperWithRole[]>(
    `${PRIVATE.COLLECTION_PAPERS}/${collectionId}/papers?workspaceId=${workspaceId}`
  );
}

export function fetchWorkspaceMembers(
  workspaceId: string,
  client: ApiClient = apiClient,
): Promise<MemberWithUser[]> {
  return client.get<MemberWithUser[]>(
    `${PRIVATE.DASHBOARD_MEMBERS}?workspaceId=${workspaceId}`
  );
}

export interface AccessibleWorkspace {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string | null;
}

export function fetchAccessibleWorkspaces(
  client: ApiClient = apiClient,
): Promise<AccessibleWorkspace[]> {
  return client.get<AccessibleWorkspace[]>(
    PRIVATE.DASHBOARD_WORKSPACES
  );
}
