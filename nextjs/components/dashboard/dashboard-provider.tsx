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
  LAST_VISITED_KEY,
  AUTO_REFRESH_CHECKER_TICK_SECONDS,
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
import type { Workspace } from "@/lib/types";
import { useDashboardStore } from "@/lib/zustand/store";

export { useDashboardStore };

interface DashboardContextType {
  setWorkspaceId: (id: string) => void;
  rootScreen: () => Promise<void>;
  projectScreen: (projectId: string) => Promise<void>;
  collectionScreen: (collectionId: string) => Promise<void>;
  loadMembers: () => Promise<void>;
  loadAccessibleWorkspaces: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();
  const initializedRef = useRef(false);
  const checkerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const getTokenOrThrow = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error("No auth token");
    return token;
  }, [getToken]);

  // ─── Workspace resolution ───

  const resolveWorkspace = useCallback(
    async (workspaceId?: string) => {
      try {
        const token = await getTokenOrThrow();
        const res = await resolveDashboard(token, workspaceId);

        if (res.error && res.redirectTo) {
          localStorage.setItem(LAST_VISITED_KEY, res.redirectTo);
          setTimeout(() => {
            router.push(`/dashboard?workspaceId=${res.redirectTo}`);
          }, 2000);
          return null;
        }

        if (res.error) {
          toast.error(res.error);
          return null;
        }

        if (res.workspaceId) {
          localStorage.setItem(LAST_VISITED_KEY, res.workspaceId);
        }

        useDashboardStore.setState({
          activeWorkspace: (res.workspace as Workspace) ?? null,
          workspaceScreenContent: res.workspaceId
            ? {
                lastFetched: 0,
                workspaceId: res.workspaceId,
                paperIdArray: [],
                projectIdArray: [],
              }
            : null,
        });

        return res.workspaceId ?? null;
      } catch (e) {
        handleError(e);
        return null;
      }
    },
    [getTokenOrThrow, router, handleError]
  );

  // ─── Screen loading ───

  const rootScreen = useCallback(async () => {
    const sc = useDashboardStore.getState().workspaceScreenContent;
    if (!sc) return;

    const stale =
      Date.now() - sc.lastFetched > DASHBOARD_IDLE_REFRESH_SECONDS * 1000;
    if (sc.lastFetched > 0 && !stale) return;

    const token = await getTokenOrThrow();
    const workspaceId = sc.workspaceId;

    try {
      const [projects, papers] = await Promise.all([
        fetchDashboardProjects(token, workspaceId),
        fetchDashboardPapers(token, workspaceId),
      ]);

      useDashboardStore.getState().upsertToProjects(projects);
      useDashboardStore.getState().upsertToPapers(papers);

      useDashboardStore.setState({
        workspaceScreenContent: {
          ...useDashboardStore.getState().workspaceScreenContent!,
          lastFetched: Date.now(),
          paperIdArray: papers.map((p) => p.paperId),
          projectIdArray: projects.map((p) => p.projectId),
        },
      });
    } catch (e) {
      handleError(e);
    }
  }, [getTokenOrThrow, handleError]);

  const projectScreen = useCallback(
    async (projectId: string) => {
      const psc = useDashboardStore
        .getState()
        .projectScreenMap.find((x) => x.projectId === projectId);

      const stale =
        psc &&
        Date.now() - psc.lastFetched > DASHBOARD_IDLE_REFRESH_SECONDS * 1000;
      if (psc && psc.lastFetched > 0 && !stale) return;

      const wsId =
        useDashboardStore.getState().workspaceScreenContent?.workspaceId;
      if (!wsId) return;

      const token = await getTokenOrThrow();

      try {
        const [collections, papers] = await Promise.all([
          fetchProjectCollections(token, projectId, wsId),
          fetchProjectPapers(token, projectId, wsId),
        ]);

        useDashboardStore.getState().upsertToCollections(collections);
        useDashboardStore.getState().upsertToPapers(papers);
      } catch (e) {
        handleError(e);
      }
    },
    [getTokenOrThrow, handleError]
  );

  const collectionScreen = useCallback(
    async (collectionId: string) => {
      const csc = useDashboardStore
        .getState()
        .collectionScreenMap.find((x) => x.collectionId === collectionId);

      const stale =
        csc &&
        Date.now() - csc.lastFetched > DASHBOARD_IDLE_REFRESH_SECONDS * 1000;
      if (csc && csc.lastFetched > 0 && !stale) return;

      const wsId =
        useDashboardStore.getState().workspaceScreenContent?.workspaceId;
      if (!wsId) return;

      const token = await getTokenOrThrow();

      try {
        const papers = await fetchCollectionPapers(token, collectionId, wsId);
        useDashboardStore.getState().upsertToPapers(papers);
      } catch (e) {
        handleError(e);
      }
    },
    [getTokenOrThrow, handleError]
  );

  // ─── Members ───

  const loadMembers = useCallback(async () => {
    const wsId =
      useDashboardStore.getState().workspaceScreenContent?.workspaceId;
    if (!wsId) return;

    try {
      const token = await getTokenOrThrow();
      const data = await fetchWorkspaceMembers(token, wsId);
      useDashboardStore.setState({
        members: data,
        lastMembersFetch: Date.now(),
      });
    } catch (e) {
      handleError(e);
    }
  }, [getTokenOrThrow, handleError]);

  // ─── Accessible workspaces ───

  const loadAccessibleWorkspaces = useCallback(async () => {
    try {
      const token = await getTokenOrThrow();
      const data = await fetchAccessibleWorkspaces(token);
      useDashboardStore.setState({
        availableWorkspaces: data as unknown as Workspace[],
      });
    } catch (e) {
      handleError(e);
    }
  }, [getTokenOrThrow, handleError]);

  // ─── Workspace ID setter ───

  const setWorkspaceId = useCallback(
    (id: string) => {
      useDashboardStore.setState({
        activeWorkspace: null,
        workspaceScreenContent: {
          lastFetched: 0,
          workspaceId: id,
          paperIdArray: [],
          projectIdArray: [],
        },
      });
      localStorage.setItem(LAST_VISITED_KEY, id);
      router.push(`/dashboard?workspaceId=${id}`);
    },
    [router]
  );

  // ─── Auto-refresh checker ───

  useEffect(() => {
    const screensToRefresh = () => {
      const state = useDashboardStore.getState();

      if (state.workspaceScreenContent) {
        const wsc = state.workspaceScreenContent;
        if (
          wsc.lastFetched > 0 &&
          Date.now() - wsc.lastFetched >
            DASHBOARD_IDLE_REFRESH_SECONDS * 1000
        ) {
          rootScreen();
        }
      }

      for (const psc of state.projectScreenMap) {
        if (
          psc.lastFetched > 0 &&
          Date.now() - psc.lastFetched >
            DASHBOARD_IDLE_REFRESH_SECONDS * 1000
        ) {
          projectScreen(psc.projectId);
        }
      }

      for (const csc of state.collectionScreenMap) {
        if (
          csc.lastFetched > 0 &&
          Date.now() - csc.lastFetched >
            DASHBOARD_IDLE_REFRESH_SECONDS * 1000
        ) {
          collectionScreen(csc.collectionId);
        }
      }
    };

    checkerTimerRef.current = setInterval(
      screensToRefresh,
      AUTO_REFRESH_CHECKER_TICK_SECONDS * 1000
    );

    return () => {
      if (checkerTimerRef.current) clearInterval(checkerTimerRef.current);
    };
  }, [rootScreen, projectScreen, collectionScreen]);

  // ─── Initialize ───

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const paramId = searchParams.get("workspaceId");
    const lastVisited = localStorage.getItem(LAST_VISITED_KEY);
    const initialId = paramId || lastVisited || undefined;

    resolveWorkspace(initialId).then((resolved) => {
      if (resolved) {
        loadAccessibleWorkspaces();
        rootScreen();
      }
    });
  }, [searchParams, resolveWorkspace, loadAccessibleWorkspaces, rootScreen]);

  return (
    <DashboardContext.Provider
      value={{
        setWorkspaceId,
        rootScreen,
        projectScreen,
        collectionScreen,
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
