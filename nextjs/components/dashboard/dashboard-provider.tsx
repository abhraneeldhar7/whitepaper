"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  DASHBOARD_IDLE_REFRESH_SECONDS,
  WORKSPACE_MEMBERS_AUTO_REFRESH_SECONDS,
  LAST_VISITED_KEY,
} from "@/lib/constants";
import {
  fetchDashboardProjects,
  fetchDashboardPapers,
  fetchProjectCollections,
  fetchProjectPapers,
  fetchCollectionPapers,
  fetchWorkspaceMembers,
  fetchAccessibleWorkspaces,
} from "@/lib/api/services/dashboard";
import { resolveDashboard } from "@/lib/api/services/workspace";
import { useDashboardStore } from "@/lib/zustand/store";

export { useDashboardStore };

interface DashboardContextType {
  setWorkspaceId: (id: string) => void;
  loadProjects: () => Promise<void>;
  loadPapers: () => Promise<void>;
  loadCollections: (projectId: string) => Promise<void>;
  loadProjectPapers: (projectId: string) => Promise<void>;
  loadCollectionPapers: (collectionId: string) => Promise<void>;
  loadMembers: () => Promise<void>;
  loadAccessibleWorkspaces: () => Promise<void>;
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

        loadAccessibleWorkspaces();
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

  const loadAccessibleWorkspaces = useCallback(async () => {
    const { token } = await getTokenAndWorkspaceId();
    if (!token) return;
    try {
      const data = await fetchAccessibleWorkspaces(token);
      store.setAccessibleWorkspaces(data);
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
        loadAccessibleWorkspaces,
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
