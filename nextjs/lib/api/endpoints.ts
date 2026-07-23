export const PRIVATE = {
  ME: "/private/users/me",
  LIST_WORKSPACES: "/private/workspaces/list",
  RESOLVE_DASHBOARD: "/private/workspaces/resolve-dashboard",
  DASHBOARD_PROJECTS: "/private/dashboard/projects",
  DASHBOARD_PAPERS: "/private/dashboard/papers",
  DASHBOARD_MEMBERS: "/private/dashboard/members",
  DASHBOARD_WORKSPACES: "/private/dashboard/workspaces",
  PROJECT_COLLECTIONS: "/private/dashboard/projects",
  PROJECT_PAPERS: "/private/dashboard/projects",
  COLLECTION_PAPERS: "/private/dashboard/collections",
  PROJECT_BY_ID: "/private/dashboard/projects",
  COLLECTION_BY_ID: "/private/dashboard/collections",
  PAPER_BY_ID: "/private/dashboard/papers",
} as const;

export const PUBLIC = {} as const;
