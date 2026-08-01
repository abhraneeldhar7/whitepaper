import { apiClient, type ApiClient } from "@/lib/api/api-client";
import { PRIVATE } from "@/lib/api/endpoints";
import type { Workspace, Project, Paper } from "@/lib/types";

export interface ProjectWithRole {
  role: string;
  data: Project;
}

export interface PaperWithRole {
  role: string;
  data: Paper;
}

export interface WorkspaceScreenData {
  projects: ProjectWithRole[];
  papers: PaperWithRole[];
}

export function resolveActiveWorkspace(
  params: { workspaceId?: string; projectId?: string; collectionId?: string; lastVisitedWorkspaceId?: string },
  client: ApiClient = apiClient,
): Promise<Workspace> {
  return client.get<Workspace>(PRIVATE.WORKSPACE_ACTIVE, {
    query: params,
  });
}

export function getAvailableWorkspaces(
  client: ApiClient = apiClient,
): Promise<Workspace[]> {
  return client.get<Workspace[]>(PRIVATE.LIST_WORKSPACES);
}

export function fetchWorkspaceScreen(
  workspaceId: string,
  client: ApiClient = apiClient,
): Promise<WorkspaceScreenData> {
  return client.get<WorkspaceScreenData>(PRIVATE.SCREEN_WORKSPACE, {
    query: { workspaceId },
  });
}
