import { apiClient, type ApiClient } from "@/lib/api/api-client";
import { PRIVATE } from "@/lib/api/endpoints";
import type { Workspace, Project, Paper } from "@/lib/types";

export interface WorkspaceItem {
  workspaceId: string;
  role: string;
  workspaceName: string;
}

export interface ProjectWithRole extends Project {
  role: string;
}

export interface PaperWithRole extends Paper {
  role: string;
}

export interface WorkspaceScreenData {
  projects: ProjectWithRole[];
  papers: PaperWithRole[];
}

export interface DashboardResponse {
  workspaceId?: string;
  workspace?: {
    workspaceId: string;
    workspaceName: string;
    workspaceSlug: string | null;
    workspaceType: string;
    plan: string;
    status: string;
  };
  papers: Array<{
    paperId: string;
    title: string;
    publicSlug: string;
    thumbnailUrl: string | null;
    visibility: string;
    projectId: string | null;
    collectionId: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  projects: Array<{
    projectId: string;
    name: string;
    publicSlug: string;
    description: string;
    logoUrl: string | null;
    visibility: string;
    createdAt: string;
    updatedAt: string;
  }>;
  workspace_role: string | null;
  project_roles: Record<string, string>;
  paper_roles: Record<string, string>;
  error?: string;
  redirectTo?: string;
}

export function resolveDashboard(
  workspaceId?: string,
  client: ApiClient = apiClient,
): Promise<DashboardResponse> {
  return client.get<DashboardResponse>(PRIVATE.RESOLVE_DASHBOARD, {
    query: { workspaceId },
  });
}

export function resolveActiveWorkspace(
  params: { workspaceId?: string; projectId?: string; collectionId?: string; lastVisitedWorkspaceId?: string },
  client: ApiClient = apiClient,
): Promise<Workspace> {
  return client.get<Workspace>(PRIVATE.WORKSPACE_ACTIVE, {
    query: params,
  });
}

export function listWorkspaces(
  client: ApiClient = apiClient,
): Promise<WorkspaceItem[]> {
  return client.get<WorkspaceItem[]>(PRIVATE.LIST_WORKSPACES);
}

export function fetchWorkspaceScreen(
  workspaceId: string,
  client: ApiClient = apiClient,
): Promise<WorkspaceScreenData> {
  return client.get<WorkspaceScreenData>(PRIVATE.SCREEN_WORKSPACE, {
    query: { workspaceId },
  });
}
