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
import type {
  ProjectWithRole,
  CollectionWithRole,
  PaperWithRole,
} from "@/lib/api/services/dashboard";
import { useDashboardStore } from "@/lib/zustand/store";

export { useDashboardStore };

interface DashboardContextType {
  setWorkspaceId: (id: string) => void;
  rootScreen: () => Promise<{
    projects: ProjectWithRole[];
    papers: PaperWithRole[];
  } | null>;
  projectScreen: (
    projectId: string
  ) => Promise<{
    collections: CollectionWithRole[];
    papers: PaperWithRole[];
  } | null>;
  collectionScreen: (collectionId: string) => Promise<PaperWithRole[] | null>;
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
      } finally {
        useDashboardStore.setState({ hydrated: true });
      }
    },
    [getTokenOrThrow, router, handleError]
  );

  // ─── Screen resolvers ───

  const rootScreen = useCallback(async () => {
    const sc = useDashboardStore.getState().workspaceScreenContent;
    if (!sc) return null;

    const stale =
      Date.now() - sc.lastFetched > DASHBOARD_IDLE_REFRESH_SECONDS * 1000;

    // Await fetch if first load
    if (sc.lastFetched === 0) {
      const token = await getTokenOrThrow();
      try {
        const [projects, papers] = await Promise.all([
          fetchDashboardProjects(token, sc.workspaceId),
          fetchDashboardPapers(token, sc.workspaceId),
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
        return { projects, papers };
      } catch (e) {
        handleError(e);
        return null;
      }
    }

    // Stale – fire refresh in background, return stale data
    if (stale) {
      try {
        const token = await getTokenOrThrow();
        Promise.all([
          fetchDashboardProjects(token, sc.workspaceId),
          fetchDashboardPapers(token, sc.workspaceId),
        ])
          .then(([projects, papers]) => {
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
          })
          .catch(handleError);
      } catch (e) {
        handleError(e);
      }
    }

    // Return data from store
    const state = useDashboardStore.getState();
    return {
      projects: state.projects.filter((p) =>
        sc.projectIdArray.includes(p.projectId)
      ),
      papers: state.papers.filter((p) =>
        sc.paperIdArray.includes(p.paperId)
      ),
    };
  }, [getTokenOrThrow, handleError]);

  const projectScreen = useCallback(
    async (projectId: string) => {
      const psc = useDashboardStore
        .getState()
        .projectScreenMap.find((x) => x.projectId === projectId);
      if (!psc) return null;

      const stale =
        Date.now() - psc.lastFetched > DASHBOARD_IDLE_REFRESH_SECONDS * 1000;

      // Await fetch if first load
      if (psc.lastFetched === 0) {
        const wsId =
          useDashboardStore.getState().workspaceScreenContent?.workspaceId;
        if (!wsId) return null;
        const token = await getTokenOrThrow();
        try {
          const [collections, papers] = await Promise.all([
            fetchProjectCollections(token, projectId, wsId),
            fetchProjectPapers(token, projectId, wsId),
          ]);
          useDashboardStore.getState().upsertToCollections(collections);
          useDashboardStore.getState().upsertToPapers(papers);
          useDashboardStore.setState((s) => ({
            projectScreenMap: s.projectScreenMap.map((x) =>
              x.projectId === projectId ? { ...x, lastFetched: Date.now() } : x
            ),
          }));
          return { collections, papers };
        } catch (e) {
          handleError(e);
          return null;
        }
      }

      // Stale – fire refresh in background, return stale data
      if (stale) {
        try {
          const wsId =
            useDashboardStore.getState().workspaceScreenContent?.workspaceId;
          if (wsId) {
            const token = await getTokenOrThrow();
            Promise.all([
              fetchProjectCollections(token, projectId, wsId),
              fetchProjectPapers(token, projectId, wsId),
            ])
              .then(([collections, papers]) => {
                useDashboardStore.getState().upsertToCollections(collections);
                useDashboardStore.getState().upsertToPapers(papers);
                useDashboardStore.setState((s) => ({
                  projectScreenMap: s.projectScreenMap.map((x) =>
                    x.projectId === projectId
                      ? { ...x, lastFetched: Date.now() }
                      : x
                  ),
                }));
              })
              .catch(handleError);
          }
        } catch (e) {
          handleError(e);
        }
      }

      // Return data from store
      const state = useDashboardStore.getState();
      return {
        collections: state.collections.filter((c) =>
          psc.collectionIdArray.includes(c.collectionId)
        ),
        papers: state.papers.filter((p) =>
          psc.paperIdArray.includes(p.paperId)
        ),
      };
    },
    [getTokenOrThrow, handleError]
  );

  const collectionScreen = useCallback(
    async (collectionId: string) => {
      const csc = useDashboardStore
        .getState()
        .collectionScreenMap.find((x) => x.collectionId === collectionId);
      if (!csc) return null;

      const stale =
        Date.now() - csc.lastFetched > DASHBOARD_IDLE_REFRESH_SECONDS * 1000;

      // Await fetch if first load
      if (csc.lastFetched === 0) {
        const wsId =
          useDashboardStore.getState().workspaceScreenContent?.workspaceId;
        if (!wsId) return null;
        const token = await getTokenOrThrow();
        try {
          const papers = await fetchCollectionPapers(
            token,
            collectionId,
            wsId
          );
          useDashboardStore.getState().upsertToPapers(papers);
          useDashboardStore.setState((s) => ({
            collectionScreenMap: s.collectionScreenMap.map((x) =>
              x.collectionId === collectionId
                ? { ...x, lastFetched: Date.now() }
                : x
            ),
          }));
          return papers;
        } catch (e) {
          handleError(e);
          return null;
        }
      }

      // Stale – fire refresh in background, return stale data
      if (stale) {
        try {
          const wsId =
            useDashboardStore.getState().workspaceScreenContent?.workspaceId;
          if (wsId) {
            const token = await getTokenOrThrow();
            fetchCollectionPapers(token, collectionId, wsId)
              .then((papers) => {
                useDashboardStore.getState().upsertToPapers(papers);
                useDashboardStore.setState((s) => ({
                  collectionScreenMap: s.collectionScreenMap.map((x) =>
                    x.collectionId === collectionId
                      ? { ...x, lastFetched: Date.now() }
                      : x
                  ),
                }));
              })
              .catch(handleError);
          }
        } catch (e) {
          handleError(e);
        }
      }

      // Return data from store
      return useDashboardStore
        .getState()
        .papers.filter((p) => csc.paperIdArray.includes(p.paperId));
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

    resolveWorkspace(initialId).then(() => {
      rootScreen();
      loadAccessibleWorkspaces();
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
