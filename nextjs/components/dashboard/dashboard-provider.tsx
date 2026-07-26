"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams, useSelectedLayoutSegments } from "next/navigation";
import { toast } from "sonner";
import { LAST_VISITED_WORKSPACEID_KEY, DASHBOARD_IDLE_REFRESH_SECONDS } from "@/lib/constants";
import {
  resolveActiveWorkspace,
  fetchWorkspaceScreen,
  type WorkspaceScreenData,
} from "@/lib/api/services/workspace";
import { fetchProjectScreen, type ProjectScreenData, type ProjectWithRole, type CollectionWithRole, fetchProjectById } from "@/lib/api/services/projects";
import { fetchCollectionScreen, fetchCollectionById } from "@/lib/api/services/collections";
import { fetchPaperById, type PaperWithRole } from "@/lib/api/services/papers";
import { ApiError } from "@/lib/api/api-client";
import { useDashboardStore } from "@/lib/zustand/store";

export { useDashboardStore };

interface DashboardContextType {
  setWorkspaceId: (id: string) => Promise<void>;
  resolveWorkspaceScreen: () => Promise<WorkspaceScreenData | undefined>;
  resolveProjectScreen: (projectId: string) => Promise<ProjectScreenData | undefined>;
  resolveCollectionScreen: (collectionId: string) => Promise<PaperWithRole[] | undefined>;
  getProjectById: (projectId: string) => Promise<ProjectWithRole | null>;
  getCollectionById: (collectionId: string) => Promise<CollectionWithRole | null>;
  getPaperById: (paperId: string) => Promise<PaperWithRole | null>;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const segments = useSelectedLayoutSegments();

  const resolveWorkspaceIdentity = useCallback(
    async (params: { workspaceId?: string; projectId?: string; collectionId?: string; lastVisitedWorkspaceId?: string }) => {
      try {
        useDashboardStore.setState({ isLoadingActiveWorkspace: true });

        const res = await resolveActiveWorkspace(params);

        localStorage.setItem(LAST_VISITED_WORKSPACEID_KEY, res.workspaceId);

        useDashboardStore.setState({ activeWorkspace: res });

        return res.workspaceId;
      } catch (e) {
        if (e instanceof ApiError) {
          const msg = JSON.parse(e.message)?.detail;

          if (msg === "no_workspace_available") {
            return null;
          }

          if (e.status === 401 || e.status === 404) {
            router.push("/dashboard");
            return null;
          }

          toast.error(e.message);
        } else {
          toast.error("You are offline");
        }
        return null;
      }
      finally {
        useDashboardStore.setState({ isLoadingActiveWorkspace: false });
      }
    },
    [router],
  );

  async function resolveWorkspaceScreen(): Promise<WorkspaceScreenData | undefined> {
    const workspaceId = useDashboardStore.getState().activeWorkspace?.workspaceId;
    if (!workspaceId) return undefined;

    const existing = useDashboardStore.getState().workspaceScreenMap;
    if (existing && Date.now() - existing.lastFetched < DASHBOARD_IDLE_REFRESH_SECONDS * 1000) {
      const { projects, papers } = useDashboardStore.getState();
      return {
        projects: projects.filter((p) => existing.projectIdArray.includes(p.projectId)),
        papers: papers.filter((p) => existing.paperIdArray.includes(p.paperId)),
      };
    }

    useDashboardStore.setState((s) => ({
      workspaceScreenMap: s.workspaceScreenMap
        ? { ...s.workspaceScreenMap, isLoading: true }
        : { lastFetched: 0, isLoading: true, workspaceId, projectIdArray: [], paperIdArray: [] },
    }));

    const data = await fetchWorkspaceScreen(workspaceId);

    useDashboardStore.getState().upsertToProjects(data.projects);
    useDashboardStore.getState().upsertToPapers(data.papers);

    useDashboardStore.setState({
      workspaceScreenMap: {
        lastFetched: Date.now(),
        isLoading: false,
        workspaceId,
        projectIdArray: data.projects.map((p) => p.projectId),
        paperIdArray: data.papers.map((p) => p.paperId),
      },
    });

    return data;
  }

  async function resolveProjectScreen(projectId: string): Promise<ProjectScreenData | undefined> {
    const maps = useDashboardStore.getState().projectScreenMap;
    const existing = maps.find((psc) => psc.projectId === projectId);
    if (existing && Date.now() - existing.lastFetched < DASHBOARD_IDLE_REFRESH_SECONDS * 1000) {
      const { collections, papers } = useDashboardStore.getState();
      return {
        collections: collections.filter((c) => existing.collectionIdArray.includes(c.collectionId)),
        papers: papers.filter((p) => existing.paperIdArray.includes(p.paperId)),
      };
    }

    useDashboardStore.setState((s) => ({
      projectScreenMap: existing
        ? s.projectScreenMap.map((psc) =>
            psc.projectId === projectId ? { ...psc, isLoading: true } : psc
          )
        : [
            ...s.projectScreenMap,
            {
              lastFetched: 0,
              isLoading: true,
              projectId,
              collectionIdArray: [],
              paperIdArray: [],
            },
          ],
    }));

    const data = await fetchProjectScreen(projectId);

    useDashboardStore.getState().upsertToCollections(data.collections);
    useDashboardStore.getState().upsertToPapers(data.papers);

    useDashboardStore.setState({
      projectScreenMap: [
        ...useDashboardStore.getState().projectScreenMap.filter((psc) => psc.projectId !== projectId),
        {
          lastFetched: Date.now(),
          isLoading: false,
          projectId,
          collectionIdArray: data.collections.map((c) => c.collectionId),
          paperIdArray: data.papers.map((p) => p.paperId),
        },
      ],
    });

    return data;
  }

  async function resolveCollectionScreen(collectionId: string): Promise<PaperWithRole[] | undefined> {
    const maps = useDashboardStore.getState().collectionScreenMap;
    const existing = maps.find((csc) => csc.collectionId === collectionId);
    if (existing && Date.now() - existing.lastFetched < DASHBOARD_IDLE_REFRESH_SECONDS * 1000) {
      const { papers } = useDashboardStore.getState();
      return papers.filter((p) => existing.paperIdArray.includes(p.paperId));
    }

    useDashboardStore.setState((s) => ({
      collectionScreenMap: existing
        ? s.collectionScreenMap.map((csc) =>
            csc.collectionId === collectionId ? { ...csc, isLoading: true } : csc
          )
        : [
            ...s.collectionScreenMap,
            {
              lastFetched: 0,
              isLoading: true,
              collectionId,
              paperIdArray: [],
            },
          ],
    }));

    const data = await fetchCollectionScreen(collectionId);

    useDashboardStore.getState().upsertToPapers(data.papers);

    useDashboardStore.setState({
      collectionScreenMap: [
        ...useDashboardStore.getState().collectionScreenMap.filter(
          (csc) => csc.collectionId !== collectionId,
        ),
        {
          lastFetched: Date.now(),
          isLoading: false,
          collectionId,
          paperIdArray: data.papers.map((p) => p.paperId),
        },
      ],
    });

    return data.papers;
  }

  async function getProjectById(projectId: string): Promise<ProjectWithRole | null> {
    const cached = useDashboardStore.getState().getProjectById(projectId);
    if (cached) return cached;

    const result = await fetchProjectById(projectId);
    if (result) useDashboardStore.getState().upsertToProjects([result]);
    return result;
  }

  async function getCollectionById(collectionId: string): Promise<CollectionWithRole | null> {
    const cached = useDashboardStore.getState().getCollectionById(collectionId);
    if (cached) return cached;

    const result = await fetchCollectionById(collectionId);
    if (result) useDashboardStore.getState().upsertToCollections([result]);
    return result;
  }

  async function getPaperById(paperId: string): Promise<PaperWithRole | null> {
    const cached = useDashboardStore.getState().getPaperById(paperId);
    if (cached) return cached;

    const result = await fetchPaperById(paperId);
    if (result) useDashboardStore.getState().upsertToPapers([result]);
    return result;
  }

  const setWorkspaceId = useCallback(
    async (id: string) => {
      localStorage.setItem(LAST_VISITED_WORKSPACEID_KEY, id);
      const result = await resolveWorkspaceIdentity({ workspaceId: id });
      if (result) router.push("/dashboard");
    },
    [router, resolveWorkspaceIdentity],
  );

  useEffect(() => {
    const queryParamWsId = searchParams.get("workspaceId");
    const lastVisitedWorkspaceId = localStorage.getItem(LAST_VISITED_WORKSPACEID_KEY);

    const resolveParams: { workspaceId?: string; projectId?: string; collectionId?: string; lastVisitedWorkspaceId?: string } = {};

    if (segments[1]) {
      resolveParams.collectionId = segments[1];
      resolveParams.projectId = segments[0];
    } else if (segments[0]) {
      resolveParams.projectId = segments[0];
    }

    if (queryParamWsId) {
      resolveParams.workspaceId = queryParamWsId;
    }

    if (lastVisitedWorkspaceId) {
      resolveParams.lastVisitedWorkspaceId = lastVisitedWorkspaceId;
    }

    resolveWorkspaceIdentity(resolveParams);
  }, [segments, searchParams, resolveWorkspaceIdentity]);

  return (
    <DashboardContext.Provider value={{
      setWorkspaceId,
      resolveWorkspaceScreen,
      resolveProjectScreen,
      resolveCollectionScreen,
      getProjectById,
      getCollectionById,
      getPaperById,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("useDashboard must be used within DashboardProvider");
  return context;
}
