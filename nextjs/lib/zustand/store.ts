import { create } from "zustand";
import type { Workspace, MemberWithUser } from "@/lib/types";
import type {
  ProjectWithRole,
  CollectionWithRole,
  PaperWithRole,
} from "@/lib/api/services/dashboard";

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
  availableWorkspaces: Workspace[];
  workspaceScreenMap: WorkspaceScreenMap | null;
  projectScreenMap: ProjectScreenMap[];
  collectionScreenMap: CollectionScreenMap[];
  papers: PaperWithRole[];
  projects: ProjectWithRole[];
  collections: CollectionWithRole[];
  members: MemberWithUser[];
  lastMembersFetch: number;

  upsertToProjects: (projects: ProjectWithRole[]) => void;
  upsertToCollections: (collections: CollectionWithRole[]) => void;
  upsertToPapers: (papers: PaperWithRole[]) => void;

  deleteFromProjects: (projectId: string) => void;
  deleteFromCollections: (collectionId: string) => void;
  deleteFromPapers: (paperId: string) => void;

  updateInProjects: (projectId: string, data: Partial<ProjectWithRole>) => void;
  updateInCollections: (collectionId: string, data: Partial<CollectionWithRole>) => void;
  updateInPapers: (paperId: string, data: Partial<PaperWithRole>) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  activeWorkspace: null,
  availableWorkspaces: [],
  workspaceScreenMap: null,
  projectScreenMap: [],
  collectionScreenMap: [],
  papers: [],
  projects: [],
  collections: [],
  members: [],
  lastMembersFetch: 0,

  upsertToProjects: (incoming) =>
    set((s) => {
      const updated = [...s.projects];
      for (const p of incoming) {
        const idx = updated.findIndex((x) => x.projectId === p.projectId);
        if (idx >= 0) updated[idx] = p;
        else updated.push(p);
      }
      return { projects: updated };
    }),

  upsertToCollections: (incoming) =>
    set((s) => {
      const updated = [...s.collections];
      for (const c of incoming) {
        const idx = updated.findIndex((x) => x.collectionId === c.collectionId);
        if (idx >= 0) updated[idx] = c;
        else updated.push(c);
      }
      return { collections: updated };
    }),

  upsertToPapers: (incoming) =>
    set((s) => {
      const updated = [...s.papers];
      for (const p of incoming) {
        const idx = updated.findIndex((x) => x.paperId === p.paperId);
        if (idx >= 0) updated[idx] = p;
        else updated.push(p);
      }
      return { papers: updated };
    }),

  deleteFromProjects: (projectId) =>
    set((s) => ({
      projects: s.projects.filter((p) => p.projectId !== projectId),
      projectScreenMap: s.projectScreenMap.filter((psc) => psc.projectId !== projectId),
    })),

  deleteFromCollections: (collectionId) =>
    set((s) => ({
      collections: s.collections.filter((c) => c.collectionId !== collectionId),
      collectionScreenMap: s.collectionScreenMap.filter((csc) => csc.collectionId !== collectionId),
      projectScreenMap: s.projectScreenMap.map((psc) =>
        psc.collectionIdArray.includes(collectionId)
          ? { ...psc, collectionIdArray: psc.collectionIdArray.filter((id) => id !== collectionId) }
          : psc
      ),
    })),

  deleteFromPapers: (paperId) =>
    set((s) => {
      const paper = s.papers.find((p) => p.paperId === paperId);
      return {
        papers: s.papers.filter((p) => p.paperId !== paperId),
        projectScreenMap: paper?.projectId
          ? s.projectScreenMap.map((psc) =>
              psc.projectId === paper.projectId
                ? { ...psc, paperIdArray: psc.paperIdArray.filter((id) => id !== paperId) }
                : psc
            )
          : s.projectScreenMap,
        collectionScreenMap: paper?.collectionId
          ? s.collectionScreenMap.map((csc) =>
              csc.collectionId === paper.collectionId
                ? { ...csc, paperIdArray: csc.paperIdArray.filter((id) => id !== paperId) }
                : csc
            )
          : s.collectionScreenMap,
      };
    }),

  updateInProjects: (projectId, data) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.projectId === projectId ? { ...p, ...data } : p
      ),
    })),

  updateInCollections: (collectionId, data) =>
    set((s) => ({
      collections: s.collections.map((c) =>
        c.collectionId === collectionId ? { ...c, ...data } : c
      ),
    })),

  updateInPapers: (paperId, data) =>
    set((s) => ({
      papers: s.papers.map((p) =>
        p.paperId === paperId ? { ...p, ...data } : p
      ),
    })),
}));
