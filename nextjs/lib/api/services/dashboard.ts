import { api } from "@/lib/api/api-client";
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
  token: string,
  workspaceId: string
): Promise<ProjectWithRole[]> {
  return api.get<ProjectWithRole[]>(
    `${PRIVATE.DASHBOARD_PROJECTS}?workspaceId=${workspaceId}`,
    { token }
  );
}

export function fetchDashboardPapers(
  token: string,
  workspaceId: string
): Promise<PaperWithRole[]> {
  return api.get<PaperWithRole[]>(
    `${PRIVATE.DASHBOARD_PAPERS}?workspaceId=${workspaceId}`,
    { token }
  );
}

export function fetchProjectCollections(
  token: string,
  projectId: string,
  workspaceId: string
): Promise<CollectionWithRole[]> {
  return api.get<CollectionWithRole[]>(
    `${PRIVATE.PROJECT_COLLECTIONS}/${projectId}/collections?workspaceId=${workspaceId}`,
    { token }
  );
}

export function fetchProjectPapers(
  token: string,
  projectId: string,
  workspaceId: string
): Promise<PaperWithRole[]> {
  return api.get<PaperWithRole[]>(
    `${PRIVATE.PROJECT_PAPERS}/${projectId}/papers?workspaceId=${workspaceId}`,
    { token }
  );
}

export function fetchCollectionPapers(
  token: string,
  collectionId: string,
  workspaceId: string
): Promise<PaperWithRole[]> {
  return api.get<PaperWithRole[]>(
    `${PRIVATE.COLLECTION_PAPERS}/${collectionId}/papers?workspaceId=${workspaceId}`,
    { token }
  );
}

export function fetchWorkspaceMembers(
  token: string,
  workspaceId: string
): Promise<MemberWithUser[]> {
  return api.get<MemberWithUser[]>(
    `${PRIVATE.DASHBOARD_MEMBERS}?workspaceId=${workspaceId}`,
    { token }
  );
}

export interface AccessibleWorkspace {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string | null;
}

export function fetchAccessibleWorkspaces(
  token: string
): Promise<AccessibleWorkspace[]> {
  return api.get<AccessibleWorkspace[]>(
    PRIVATE.DASHBOARD_WORKSPACES,
    { token }
  );
}
