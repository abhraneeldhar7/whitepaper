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
