import { api } from "@/lib/api/api-client";
import { PRIVATE } from "@/lib/api/endpoints";

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
  token: string,
  workspaceId?: string
): Promise<DashboardResponse> {
  const params = workspaceId ? `?workspaceId=${workspaceId}` : "";
  return api.get<DashboardResponse>(
    `${PRIVATE.RESOLVE_DASHBOARD}${params}`,
    { token }
  );
}
