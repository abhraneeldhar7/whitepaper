import { create } from "zustand";
import {
  DASHBOARD_IDLE_REFRESH_SECONDS,
  WORKSPACE_MEMBERS_AUTO_REFRESH_SECONDS,
} from "@/lib/constants";
import {
  type ProjectWithRole,
  type CollectionWithRole,
  type PaperWithRole,
  type AccessibleWorkspace,
} from "@/lib/api/services/dashboard";
import { type DashboardResponse } from "@/lib/api/services/workspace";
import { type MemberWithUser } from "@/lib/types";

interface DashboardState {
  workspaceId: string | null;
  workspace: DashboardResponse["workspace"] | null;
  accessibleWorkspaces: AccessibleWorkspace[];
  projects: ProjectWithRole[];
  papers: PaperWithRole[];
  collections: CollectionWithRole[];
  members: MemberWithUser[];
  isLoading: boolean;
  error: string | null;

  lastEntitiesFetch: number;
  lastMembersFetch: number;

  setWorkspaceId: (id: string) => void;
  setWorkspace: (w: DashboardResponse["workspace"]) => void;
  setAccessibleWorkspaces: (w: AccessibleWorkspace[]) => void;
  setProjects: (p: ProjectWithRole[]) => void;
  setPapers: (p: PaperWithRole[]) => void;
  setCollections: (c: CollectionWithRole[]) => void;
  setMembers: (m: MemberWithUser[]) => void;
  setIsLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  updateProject: (projectId: string, data: Partial<ProjectWithRole>) => void;
  removeProject: (projectId: string) => void;
  addProject: (p: ProjectWithRole) => void;
  updatePaper: (paperId: string, data: Partial<PaperWithRole>) => void;
  removePaper: (paperId: string) => void;
  addPaper: (p: PaperWithRole) => void;
  updateCollection: (collectionId: string, data: Partial<CollectionWithRole>) => void;
  removeCollection: (collectionId: string) => void;
  addCollection: (c: CollectionWithRole) => void;

  isEntitiesStale: () => boolean;
  isMembersStale: () => boolean;
  markEntitiesFresh: () => void;
  markMembersFresh: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  workspaceId: null,
  workspace: null,
  accessibleWorkspaces: [],
  projects: [],
  papers: [],
  collections: [],
  members: [],
  isLoading: true,
  error: null,

  lastEntitiesFetch: 0,
  lastMembersFetch: 0,

  setWorkspaceId: (id) => set({ workspaceId: id }),
  setWorkspace: (w) => set({ workspace: w }),
  setAccessibleWorkspaces: (w) => set({ accessibleWorkspaces: w }),
  setProjects: (p) => set({ projects: p }),
  setPapers: (p) => set({ papers: p }),
  setCollections: (c) => set({ collections: c }),
  setMembers: (m: MemberWithUser[]) => set({ members: m }),
  setIsLoading: (v) => set({ isLoading: v }),
  setError: (e) => set({ error: e }),

  updateProject: (projectId, data) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.projectId === projectId ? { ...p, ...data } : p
      ),
    })),
  removeProject: (projectId) =>
    set((s) => ({
      projects: s.projects.filter((p) => p.projectId !== projectId),
    })),
  addProject: (p) => set((s) => ({ projects: [...s.projects, p] })),

  updatePaper: (paperId, data) =>
    set((s) => ({
      papers: s.papers.map((p) =>
        p.paperId === paperId ? { ...p, ...data } : p
      ),
    })),
  removePaper: (paperId) =>
    set((s) => ({
      papers: s.papers.filter((p) => p.paperId !== paperId),
    })),
  addPaper: (p) => set((s) => ({ papers: [...s.papers, p] })),

  updateCollection: (collectionId, data) =>
    set((s) => ({
      collections: s.collections.map((c) =>
        c.collectionId === collectionId ? { ...c, ...data } : c
      ),
    })),
  removeCollection: (collectionId) =>
    set((s) => ({
      collections: s.collections.filter((c) => c.collectionId !== collectionId),
    })),
  addCollection: (c) => set((s) => ({ collections: [...s.collections, c] })),

  isEntitiesStale: () => {
    const { lastEntitiesFetch } = get();
    return Date.now() - lastEntitiesFetch > DASHBOARD_IDLE_REFRESH_SECONDS * 1000;
  },
  isMembersStale: () => {
    const { lastMembersFetch } = get();
    return Date.now() - lastMembersFetch > WORKSPACE_MEMBERS_AUTO_REFRESH_SECONDS * 1000;
  },
  markEntitiesFresh: () => set({ lastEntitiesFetch: Date.now() }),
  markMembersFresh: () => set({ lastMembersFetch: Date.now() }),
}));
