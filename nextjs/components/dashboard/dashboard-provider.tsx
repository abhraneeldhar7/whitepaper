"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { create } from "zustand";
import {
  DASHBOARD_IDLE_REFRESH_SECONDS,
  WORKSPACE_MEMBERS_AUTO_REFRESH_SECONDS,
  LAST_VISITED_KEY,
} from "./constants";
import {
  fetchDashboardProjects,
  fetchDashboardPapers,
  fetchProjectCollections,
  fetchProjectPapers,
  fetchCollectionPapers,
  fetchWorkspaceMembers,
  type ProjectWithRole,
  type CollectionWithRole,
  type PaperWithRole,
  type MemberWithInfo,
} from "@/lib/api/services/dashboard";
import { resolveDashboard, type DashboardResponse } from "@/lib/api/services/workspace";

interface DashboardState {
  workspaceId: string | null;
  workspace: DashboardResponse["workspace"] | null;
  projects: ProjectWithRole[];
  papers: PaperWithRole[];
  collections: CollectionWithRole[];
  members: MemberWithInfo[];
  isLoading: boolean;
  error: string | null;

  lastEntitiesFetch: number;
  lastMembersFetch: number;

  setWorkspaceId: (id: string) => void;
  setWorkspace: (w: DashboardResponse["workspace"]) => void;
  setProjects: (p: ProjectWithRole[]) => void;
  setPapers: (p: PaperWithRole[]) => void;
  setCollections: (c: CollectionWithRole[]) => void;
  setMembers: (m: MemberWithInfo[]) => void;
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
  setProjects: (p) => set({ projects: p }),
  setPapers: (p) => set({ papers: p }),
  setCollections: (c) => set({ collections: c }),
  setMembers: (m) => set({ members: m }),
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

interface DashboardContextType {
  setWorkspaceId: (id: string) => void;
  loadProjects: () => Promise<void>;
  loadPapers: () => Promise<void>;
  loadCollections: (projectId: string) => Promise<void>;
  loadProjectPapers: (projectId: string) => Promise<void>;
  loadCollectionPapers: (collectionId: string) => Promise<void>;
  loadMembers: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken, isSignedIn } = useAuth();
  const store = useDashboardStore();
  const entityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const memberTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initializedRef = useRef(false);

  const handleError = useCallback(
    (e: unknown) => {
      if (e instanceof Error) {
        const msg = e.message;
        if (msg.includes("401") || msg.includes("403")) {
          router.push("/dashboard");
          return;
        }
      }
      toast.error("You are offline");
    },
    [router]
  );

  const getTokenAndWorkspaceId = useCallback(async () => {
    if (!isSignedIn) return { token: null, wid: null };
    const token = await getToken();
    const wid = useDashboardStore.getState().workspaceId;
    return { token, wid };
  }, [isSignedIn, getToken]);

  const loadWorkspaceData = useCallback(
    async (workspaceId?: string) => {
      try {
        store.setIsLoading(true);
        store.setError(null);

        const token = await getToken();
        if (!token) throw new Error("No auth token");

        const res = await resolveDashboard(token, workspaceId);

        if (res.error && res.redirectTo) {
          store.setError(res.error);
          localStorage.setItem(LAST_VISITED_KEY, res.redirectTo);
          setTimeout(() => {
            router.push(`/dashboard?workspaceId=${res.redirectTo}`);
          }, 2000);
          return;
        }

        if (res.error) {
          store.setError(res.error);
          store.setIsLoading(false);
          return;
        }

        store.setWorkspace(res.workspace ?? undefined);
        if (res.workspaceId) {
          store.setWorkspaceId(res.workspaceId);
          localStorage.setItem(LAST_VISITED_KEY, res.workspaceId);
        }

        store.markEntitiesFresh();
        store.markMembersFresh();
      } catch (e) {
        handleError(e);
      } finally {
        store.setIsLoading(false);
      }
    },
    [getToken, router, handleError, store]
  );

  const loadProjects = useCallback(async () => {
    const { token, wid } = await getTokenAndWorkspaceId();
    if (!token || !wid) return;
    try {
      const data = await fetchDashboardProjects(token, wid);
      store.setProjects(data);
      store.markEntitiesFresh();
    } catch (e) {
      handleError(e);
    }
  }, [getTokenAndWorkspaceId, handleError, store]);

  const loadPapers = useCallback(async () => {
    const { token, wid } = await getTokenAndWorkspaceId();
    if (!token || !wid) return;
    try {
      const data = await fetchDashboardPapers(token, wid);
      store.setPapers(data);
      store.markEntitiesFresh();
    } catch (e) {
      handleError(e);
    }
  }, [getTokenAndWorkspaceId, handleError, store]);

  const loadCollections = useCallback(
    async (projectId: string) => {
      const { token, wid } = await getTokenAndWorkspaceId();
      if (!token || !wid) return;
      try {
        const data = await fetchProjectCollections(token, projectId, wid);
        store.setCollections(data);
        store.markEntitiesFresh();
      } catch (e) {
        handleError(e);
      }
    },
    [getTokenAndWorkspaceId, handleError, store]
  );

  const loadProjectPapers = useCallback(
    async (projectId: string) => {
      const { token, wid } = await getTokenAndWorkspaceId();
      if (!token || !wid) return;
      try {
        const data = await fetchProjectPapers(token, projectId, wid);
        store.setPapers(data);
        store.markEntitiesFresh();
      } catch (e) {
        handleError(e);
      }
    },
    [getTokenAndWorkspaceId, handleError, store]
  );

  const loadCollectionPapers = useCallback(
    async (collectionId: string) => {
      const { token, wid } = await getTokenAndWorkspaceId();
      if (!token || !wid) return;
      try {
        const data = await fetchCollectionPapers(token, collectionId, wid);
        store.setPapers(data);
        store.markEntitiesFresh();
      } catch (e) {
        handleError(e);
      }
    },
    [getTokenAndWorkspaceId, handleError, store]
  );

  const loadMembers = useCallback(async () => {
    const { token, wid } = await getTokenAndWorkspaceId();
    if (!token || !wid) return;
    try {
      const data = await fetchWorkspaceMembers(token, wid);
      store.setMembers(data);
      store.markMembersFresh();
    } catch (e) {
      handleError(e);
    }
  }, [getTokenAndWorkspaceId, handleError, store]);

  const setWorkspaceId = useCallback(
    (id: string) => {
      store.setWorkspaceId(id);
      localStorage.setItem(LAST_VISITED_KEY, id);
      router.push(`/dashboard?workspaceId=${id}`);
    },
    [router, store]
  );

  // Initialize workspaceId from localStorage or query params
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const paramId = searchParams.get("workspaceId");
    const lastVisited = localStorage.getItem(LAST_VISITED_KEY);
    const initialId = paramId || lastVisited || undefined;

    if (paramId) {
      store.setWorkspaceId(paramId);
      localStorage.setItem(LAST_VISITED_KEY, paramId);
    }

    loadWorkspaceData(initialId);
  }, [searchParams, loadWorkspaceData, store]);

  // Entity refresh timer (20s)
  useEffect(() => {
    entityTimerRef.current = setInterval(() => {
      const state = useDashboardStore.getState();
      if (state.workspaceId && state.isEntitiesStale()) {
        loadProjects();
        loadPapers();
      }
    }, DASHBOARD_IDLE_REFRESH_SECONDS * 1000);

    return () => {
      if (entityTimerRef.current) clearInterval(entityTimerRef.current);
    };
  }, [loadProjects, loadPapers]);

  // Members refresh timer (60s)
  useEffect(() => {
    memberTimerRef.current = setInterval(() => {
      const state = useDashboardStore.getState();
      if (state.workspaceId && state.isMembersStale()) {
        loadMembers();
      }
    }, WORKSPACE_MEMBERS_AUTO_REFRESH_SECONDS * 1000);

    return () => {
      if (memberTimerRef.current) clearInterval(memberTimerRef.current);
    };
  }, [loadMembers]);

  return (
    <DashboardContext.Provider
      value={{
        setWorkspaceId,
        loadProjects,
        loadPapers,
        loadCollections,
        loadProjectPapers,
        loadCollectionPapers,
        loadMembers,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context)
    throw new Error("useDashboard must be used within DashboardProvider");
  return context;
}
