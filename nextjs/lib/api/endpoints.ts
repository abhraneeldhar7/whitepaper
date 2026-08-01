export const PRIVATE = {
  ME: "/private/users/me",
  LIST_WORKSPACES: "/private/workspaces/list",
  WORKSPACE_ACTIVE: "/private/workspaces/active",
  DASHBOARD_PROJECTS: "/private/dashboard/projects",
  DASHBOARD_PAPERS: "/private/dashboard/papers",
  DASHBOARD_MEMBERS: "/private/dashboard/members",
  DASHBOARD_WORKSPACES: "/private/dashboard/workspaces",
  PROJECT_COLLECTIONS: "/private/dashboard/projects",
  PROJECT_PAPERS: "/private/dashboard/projects",
  COLLECTION_PAPERS: "/private/dashboard/collections",
  PROJECT_BY_ID: "/private/projects",
  PROJECT_CREATE: "/private/projects/create",
  PROJECT_CHECK_SLUG: "/private/projects/check-slug",
  COLLECTION_BY_ID: "/private/collections",
  PAPER_BY_ID: "/private/papers/id",
  SCREEN_WORKSPACE: "/private/screen/workspace",
  SCREEN_PROJECT: "/private/screen/project",
  SCREEN_COLLECTION: "/private/screen/collection",
} as const;

export const PUBLIC = {} as const;
