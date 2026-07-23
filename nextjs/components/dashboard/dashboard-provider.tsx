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
import type {
  ProjectWithRole,
  CollectionWithRole,
  PaperWithRole,
} from "@/lib/api/services/dashboard";
import { useDashboardStore } from "@/lib/zustand/store";

export { useDashboardStore };

interface DashboardContextType {
  setWorkspaceId: (id: string) => void;
  resolveWorkspaceScreen: () => Promise<{
    projects: ProjectWithRole[];
    papers: PaperWithRole[];
  } | null>;
  resolveProjectScreen: (
    projectId: string
  ) => Promise<{
    collections: CollectionWithRole[];
    papers: PaperWithRole[];
  } | null>;
  resolveCollectionScreen: (collectionId: string) => Promise<PaperWithRole[] | null>;
  loadMembers: () => Promise<void>;
  loadAccessibleWorkspaces: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  // ─── Helpers ───

  const getWorkspaceId = useCallback(() => {
    return useDashboardStore.getState().workspaceScreenMap?.workspaceId ?? null;
  }, []);

  // ─── Workspace resolution ───

  const resolveWorkspaceIdentity = useCallback(
    async (workspaceId?: string) => {
      try {
        const res = await resolveDashboard(workspaceId);

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
          workspaceScreenMap: res.workspaceId
            ? {
                lastFetched: 0,
                isLoading: false,
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
    [router, handleError]
  );

  // ─── Screen resolvers ───

  const fetchWorkspaceData = useCallback(
    async (wsId: string) => {
      const [projects, papers] = await Promise.all([
        fetchDashboardProjects(wsId),
        fetchDashboardPapers(wsId),
      ]);
      useDashboardStore.getState().upsertToProjects(projects);
      useDashboardStore.getState().upsertToPapers(papers);
      return { projects, papers };
    },
    []
  );

  const fetchProjectData = useCallback(
    async (projectId: string, wsId: string) => {
      const [collections, papers] = await Promise.all([
        fetchProjectCollections(projectId, wsId),
        fetchProjectPapers(projectId, wsId),
      ]);
      useDashboardStore.getState().upsertToCollections(collections);
      useDashboardStore.getState().upsertToPapers(papers);
      return { collections, papers };
    },
    []
  );

  const fetchCollectionData = useCallback(
    async (collectionId: string, wsId: string) => {
      const papers = await fetchCollectionPapers(collectionId, wsId);
      useDashboardStore.getState().upsertToPapers(papers);
      return papers;
    },
    []
  );

  const resolveWorkspaceScreen = useCallback(async () => {
    let wsm = useDashboardStore.getState().workspaceScreenMap;
    if (!wsm) return null;

    // Skip if already loading
    if (wsm.isLoading) return null;

    const stale =
      Date.now() - wsm.lastFetched > DASHBOARD_IDLE_REFRESH_SECONDS * 1000;

    if (wsm.lastFetched === 0 || stale) {
      useDashboardStore.setState({
        workspaceScreenMap: { ...useDashboardStore.getState().workspaceScreenMap!, isLoading: true },
      });
      try {
        const { projects, papers } = await fetchWorkspaceData(wsm.workspaceId);
        useDashboardStore.setState({
          workspaceScreenMap: {
            ...useDashboardStore.getState().workspaceScreenMap!,
            lastFetched: Date.now(),
            isLoading: false,
            projectIdArray: projects.map((p) => p.projectId),
            paperIdArray: papers.map((p) => p.paperId),
          },
        });
        return { projects, papers };
      } catch (e) {
        useDashboardStore.setState({
          workspaceScreenMap: { ...useDashboardStore.getState().workspaceScreenMap!, isLoading: false },
        });
        handleError(e);
        return null;
      }
    }

    // Data is fresh — return from zustand
    const state = useDashboardStore.getState();
    return {
      projects: state.projects.filter((p) => wsm.projectIdArray.includes(p.projectId)),
      papers: state.papers.filter((p) => wsm.paperIdArray.includes(p.paperId)),
    };
  }, [fetchWorkspaceData, handleError]);

  const resolveProjectScreen = useCallback(
    async (projectId: string) => {
      const wsId = getWorkspaceId();
      if (!wsId) return null;

      let psm = useDashboardStore
        .getState()
        .projectScreenMap.find((x) => x.projectId === projectId);

      // First load – create entry
      if (!psm) {
        useDashboardStore.setState((s) => ({
          projectScreenMap: [
            ...s.projectScreenMap,
            { lastFetched: 0, isLoading: false, projectId, paperIdArray: [], collectionIdArray: [] },
          ],
        }));
        psm = useDashboardStore.getState().projectScreenMap.find((x) => x.projectId === projectId);
      }
      if (!psm) return null;

      // Skip if already loading
      if (psm.isLoading) return null;

      const stale =
        Date.now() - psm.lastFetched > DASHBOARD_IDLE_REFRESH_SECONDS * 1000;

      if (psm.lastFetched === 0 || stale) {
        useDashboardStore.setState((s) => ({
          projectScreenMap: s.projectScreenMap.map((x) =>
            x.projectId === projectId ? { ...x, isLoading: true } : x
          ),
        }));
        try {
          const { collections, papers } = await fetchProjectData(projectId, wsId);
          useDashboardStore.setState((s) => ({
            projectScreenMap: s.projectScreenMap.map((x) =>
              x.projectId === projectId
                ? {
                    ...x,
                    lastFetched: Date.now(),
                    isLoading: false,
                    collectionIdArray: collections.map((c) => c.collectionId),
                    paperIdArray: papers.map((p) => p.paperId),
                  }
                : x
            ),
          }));
          return { collections, papers };
        } catch (e) {
          useDashboardStore.setState((s) => ({
            projectScreenMap: s.projectScreenMap.map((x) =>
              x.projectId === projectId ? { ...x, isLoading: false } : x
            ),
          }));
          handleError(e);
          return null;
        }
      }

      // Data is fresh — return from zustand
      const state = useDashboardStore.getState();
      return {
        collections: state.collections.filter((c) => psm.collectionIdArray.includes(c.collectionId)),
        papers: state.papers.filter((p) => psm.paperIdArray.includes(p.paperId)),
      };
    },
    [fetchProjectData, getWorkspaceId, handleError]
  );

  const resolveCollectionScreen = useCallback(
    async (collectionId: string) => {
      const wsId = getWorkspaceId();
      if (!wsId) return null;

      let csm = useDashboardStore
        .getState()
        .collectionScreenMap.find((x) => x.collectionId === collectionId);

      // First load – create entry
      if (!csm) {
        useDashboardStore.setState((s) => ({
          collectionScreenMap: [
            ...s.collectionScreenMap,
            { lastFetched: 0, isLoading: false, collectionId, paperIdArray: [] },
          ],
        }));
        csm = useDashboardStore.getState().collectionScreenMap.find((x) => x.collectionId === collectionId);
      }
      if (!csm) return null;

      // Skip if already loading
      if (csm.isLoading) return null;

      const stale =
        Date.now() - csm.lastFetched > DASHBOARD_IDLE_REFRESH_SECONDS * 1000;

      if (csm.lastFetched === 0 || stale) {
        useDashboardStore.setState((s) => ({
          collectionScreenMap: s.collectionScreenMap.map((x) =>
            x.collectionId === collectionId ? { ...x, isLoading: true } : x
          ),
        }));
        try {
          const papers = await fetchCollectionData(collectionId, wsId);
          useDashboardStore.setState((s) => ({
            collectionScreenMap: s.collectionScreenMap.map((x) =>
              x.collectionId === collectionId
                ? { ...x, lastFetched: Date.now(), isLoading: false, paperIdArray: papers.map((p) => p.paperId) }
                : x
            ),
          }));
          return papers;
        } catch (e) {
          useDashboardStore.setState((s) => ({
            collectionScreenMap: s.collectionScreenMap.map((x) =>
              x.collectionId === collectionId ? { ...x, isLoading: false } : x
            ),
          }));
          handleError(e);
          return null;
        }
      }

      // Data is fresh — return from zustand
      const state = useDashboardStore.getState();
      return state.papers.filter((p) => csm.paperIdArray.includes(p.paperId));
    },
    [fetchCollectionData, getWorkspaceId, handleError]
  );

  // ─── Members ───

  const loadMembers = useCallback(async () => {
    const wsId = getWorkspaceId();
    if (!wsId) return;

    try {
      const data = await fetchWorkspaceMembers(wsId);
      useDashboardStore.setState({
        members: data,
        lastMembersFetch: Date.now(),
      });
    } catch (e) {
      handleError(e);
    }
  }, [getWorkspaceId, handleError]);

  // ─── Accessible workspaces ───

  const loadAccessibleWorkspaces = useCallback(async () => {
    try {
      const data = await fetchAccessibleWorkspaces();
      useDashboardStore.setState({
        availableWorkspaces: data as unknown as Workspace[],
      });
    } catch (e) {
      handleError(e);
    }
  }, [handleError]);

  // ─── Workspace ID setter ───

  const setWorkspaceId = useCallback(
    (id: string) => {
      useDashboardStore.setState({
        activeWorkspace: null,
        workspaceScreenMap: {
          lastFetched: 0,
          isLoading: false,
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

      if (state.workspaceScreenMap) {
        const wsm = state.workspaceScreenMap;
        if (
          wsm.lastFetched > 0 &&
          Date.now() - wsm.lastFetched >
            DASHBOARD_IDLE_REFRESH_SECONDS * 1000
        ) {
          resolveWorkspaceScreen();
        }
      }

      for (const psm of state.projectScreenMap) {
        if (
          psm.lastFetched > 0 &&
          Date.now() - psm.lastFetched >
            DASHBOARD_IDLE_REFRESH_SECONDS * 1000
        ) {
          resolveProjectScreen(psm.projectId);
        }
      }

      for (const csm of state.collectionScreenMap) {
        if (
          csm.lastFetched > 0 &&
          Date.now() - csm.lastFetched >
            DASHBOARD_IDLE_REFRESH_SECONDS * 1000
        ) {
          resolveCollectionScreen(csm.collectionId);
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
  }, [resolveWorkspaceScreen, resolveProjectScreen, resolveCollectionScreen]);

  // ─── Initialize ───

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const paramId = searchParams.get("workspaceId");
    const lastVisited = localStorage.getItem(LAST_VISITED_KEY);
    const initialId = paramId || lastVisited || undefined;

    resolveWorkspaceIdentity(initialId).then(() => {
      resolveWorkspaceScreen();
      loadAccessibleWorkspaces();
    });
  }, [searchParams, resolveWorkspaceIdentity, loadAccessibleWorkspaces, resolveWorkspaceScreen]);

  return (
    <DashboardContext.Provider
      value={{
        setWorkspaceId,
        resolveWorkspaceScreen,
        resolveProjectScreen,
        resolveCollectionScreen,
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
