import { create } from "zustand";
import type { Workspace, MemberWithUser } from "@/shared/types";
import type {
  ProjectWithRole,
  CollectionWithRole,
  PaperWithRole,
} from "@/lib/api/services/workspace";

interface AvailableWorkspacesMap {
  isLoading: boolean;
  lastFetched: number;
  workspaceIds: string[];
}

interface WorkspaceScreenMap {
  lastFetched: number;
  isLoading: boolean;
  workspaceId: string;
  paperIdArray: string[];
  projectIdArray: string[];
}

interface ProjectScreenMap {
  lastFetched: number;
  isLoading: boolean;
  projectId: string;
  paperIdArray: string[];
  collectionIdArray: string[];
}

interface CollectionScreenMap {
  lastFetched: number;
  isLoading: boolean;
  collectionId: string;
  paperIdArray: string[];
}

interface DashboardState {
  activeWorkspace: Workspace | null;
  isLoadingActiveWorkspace: boolean;
  availableWorkspacesMap: AvailableWorkspacesMap;

  workspaceScreenMap: WorkspaceScreenMap | null;
  projectScreenMap: ProjectScreenMap[];
  collectionScreenMap: CollectionScreenMap[];

  workspaces: Workspace[];
  papers: PaperWithRole[];
  projects: ProjectWithRole[];
  collections: CollectionWithRole[];

  members: MemberWithUser[];
  lastMembersFetch: number;

  upsertToWorkspaces: (workspaces: Workspace[]) => void;
  upsertToProjects: (projects: ProjectWithRole[]) => void;
  upsertToCollections: (collections: CollectionWithRole[]) => void;
  upsertToPapers: (papers: PaperWithRole[]) => void;

  deleteFromProjects: (projectId: string) => void;
  deleteFromCollections: (collectionId: string) => void;
  deleteFromPapers: (paperId: string) => void;

  updateInProjects: (projectId: string, data: Partial<ProjectWithRole>) => void;
  updateInCollections: (collectionId: string, data: Partial<CollectionWithRole>) => void;
  updateInPapers: (paperId: string, data: Partial<PaperWithRole>) => void;

  getWorkspaceById: (workspaceId: string) => Workspace | undefined;
  getProjectById: (projectId: string) => ProjectWithRole | undefined;
  getCollectionById: (collectionId: string) => CollectionWithRole | undefined;
  getPaperById: (paperId: string) => PaperWithRole | undefined;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  activeWorkspace: null,
  isLoadingActiveWorkspace: true,
  availableWorkspacesMap: { isLoading: false, lastFetched: 0, workspaceIds: [] },
  workspaceScreenMap: null,
  projectScreenMap: [],
  collectionScreenMap: [],
  workspaces: [],
  papers: [],
  projects: [],
  collections: [],
  members: [],
  lastMembersFetch: 0,

  upsertToWorkspaces: (incoming) =>
    set((s) => {
      const updated = [...s.workspaces];
      for (const w of incoming) {
        const idx = updated.findIndex((x) => x.workspaceId === w.workspaceId);
        if (idx >= 0) updated[idx] = w;
        else updated.push(w);
      }
      return { workspaces: updated };
    }),

  upsertToProjects: (incoming) =>
    set((s) => {
      const updated = [...s.projects];
      const newIds: string[] = [];
      for (const p of incoming) {
        const idx = updated.findIndex((x) => x.data.projectId === p.data.projectId);
        if (idx >= 0) updated[idx] = p;
        else { updated.push(p); newIds.push(p.data.projectId); }
      }
      const wsm = s.workspaceScreenMap;
      return {
        projects: updated,
        workspaceScreenMap: wsm && newIds.length > 0 && incoming.some((p) => p.data.workspaceId === wsm.workspaceId)
          ? { ...wsm, projectIdArray: [...new Set([...wsm.projectIdArray, ...newIds])] }
          : wsm,
      };
    }),

  upsertToCollections: (incoming) =>
    set((s) => {
      const updated = [...s.collections];
      let psm = s.projectScreenMap;
      for (const c of incoming) {
        const idx = updated.findIndex((x) => x.data.collectionId === c.data.collectionId);
        if (idx >= 0) updated[idx] = c;
        else {
          updated.push(c);
          psm = psm.map((psc) =>
            psc.projectId === c.data.projectId && !psc.collectionIdArray.includes(c.data.collectionId)
              ? { ...psc, collectionIdArray: [...psc.collectionIdArray, c.data.collectionId] }
              : psc
          );
        }
      }
      return { collections: updated, projectScreenMap: psm };
    }),

  upsertToPapers: (incoming) =>
    set((s) => {
      const updated = [...s.papers];
      let wsm = s.workspaceScreenMap;
      let psm = s.projectScreenMap;
      let csm = s.collectionScreenMap;
      for (const p of incoming) {
        const idx = updated.findIndex((x) => x.data.paperId === p.data.paperId);
        if (idx >= 0) updated[idx] = p;
        else {
          updated.push(p);
          if (!p.data.projectId && !p.data.collectionId && wsm && wsm.workspaceId === p.data.workspaceId && !wsm.paperIdArray.includes(p.data.paperId)) {
            wsm = { ...wsm, paperIdArray: [...wsm.paperIdArray, p.data.paperId] };
          }
          if (p.data.projectId) {
            psm = psm.map((psc) =>
              psc.projectId === p.data.projectId && !psc.paperIdArray.includes(p.data.paperId)
                ? { ...psc, paperIdArray: [...psc.paperIdArray, p.data.paperId] }
                : psc
            );
          }
          if (p.data.collectionId) {
            csm = csm.map((csc) =>
              csc.collectionId === p.data.collectionId && !csc.paperIdArray.includes(p.data.paperId)
                ? { ...csc, paperIdArray: [...csc.paperIdArray, p.data.paperId] }
                : csc
            );
          }
        }
      }
      return { papers: updated, workspaceScreenMap: wsm, projectScreenMap: psm, collectionScreenMap: csm };
    }),

  deleteFromProjects: (projectId) =>
    set((s) => {
      const wsm = s.workspaceScreenMap;
      return {
        projects: s.projects.filter((p) => p.data.projectId !== projectId),
        projectScreenMap: s.projectScreenMap.filter((psc) => psc.projectId !== projectId),
        workspaceScreenMap: wsm
          ? { ...wsm, projectIdArray: wsm.projectIdArray.filter((id) => id !== projectId) }
          : null,
      };
    }),

  deleteFromCollections: (collectionId) =>
    set((s) => ({
      collections: s.collections.filter((c) => c.data.collectionId !== collectionId),
      collectionScreenMap: s.collectionScreenMap.filter((csc) => csc.collectionId !== collectionId),
      projectScreenMap: s.projectScreenMap.map((psc) =>
        psc.collectionIdArray.includes(collectionId)
          ? { ...psc, collectionIdArray: psc.collectionIdArray.filter((id) => id !== collectionId) }
          : psc
      ),
    })),

  deleteFromPapers: (paperId) =>
    set((s) => {
      const paper = s.papers.find((p) => p.data.paperId === paperId);
      const isRoot = Boolean(paper && !paper.data.projectId && !paper.data.collectionId);
      return {
        papers: s.papers.filter((p) => p.data.paperId !== paperId),
        workspaceScreenMap: isRoot && s.workspaceScreenMap
          ? { ...s.workspaceScreenMap, paperIdArray: s.workspaceScreenMap.paperIdArray.filter((id) => id !== paperId) }
          : s.workspaceScreenMap,
        projectScreenMap: paper?.data.projectId
          ? s.projectScreenMap.map((psc) =>
              psc.projectId === paper.data.projectId
                ? { ...psc, paperIdArray: psc.paperIdArray.filter((id) => id !== paperId) }
                : psc
            )
          : s.projectScreenMap,
        collectionScreenMap: paper?.data.collectionId
          ? s.collectionScreenMap.map((csc) =>
              csc.collectionId === paper.data.collectionId
                ? { ...csc, paperIdArray: csc.paperIdArray.filter((id) => id !== paperId) }
                : csc
            )
          : s.collectionScreenMap,
      };
    }),

  updateInProjects: (projectId, data) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.data.projectId === projectId ? { ...p, data: { ...p.data, ...data.data } } : p
      ),
    })),

  updateInCollections: (collectionId, data) =>
    set((s) => ({
      collections: s.collections.map((c) =>
        c.data.collectionId === collectionId ? { ...c, data: { ...c.data, ...data.data } } : c
      ),
    })),

  updateInPapers: (paperId, data) =>
    set((s) => ({
      papers: s.papers.map((p) =>
        p.data.paperId === paperId ? { ...p, data: { ...p.data, ...data.data } } : p
      ),
    })),

  getWorkspaceById: (workspaceId) =>
    get().workspaces.find((w) => w.workspaceId === workspaceId),

  getProjectById: (projectId) =>
    get().projects.find((p) => p.data.projectId === projectId),

  getCollectionById: (collectionId) =>
    get().collections.find((c) => c.data.collectionId === collectionId),

  getPaperById: (paperId) =>
    get().papers.find((p) => p.data.paperId === paperId),
}));
