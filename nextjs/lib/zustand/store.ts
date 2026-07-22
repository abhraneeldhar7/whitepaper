import { create } from "zustand";
import type { Workspace, MemberWithUser } from "@/lib/types";
import type {
  ProjectWithRole,
  CollectionWithRole,
  PaperWithRole,
} from "@/lib/api/services/dashboard";

interface WorkspaceScreenContent {
  lastFetched: number;
  workspaceId: string;
  paperIdArray: string[];
  projectIdArray: string[];
}

interface ProjectScreenContent {
  lastFetched: number;
  projectId: string;
  paperIdArray: string[];
  collectionIdArray: string[];
}

interface CollectionScreenContent {
  lastFetched: number;
  collectionId: string;
  paperIdArray: string[];
}

interface DashboardState {
  activeWorkspace: Workspace | null;
  availableWorkspaces: Workspace[];
  workspaceScreenContent: WorkspaceScreenContent | null;
  projectScreenMap: ProjectScreenContent[];
  collectionScreenMap: CollectionScreenContent[];
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
  workspaceScreenContent: null,
  projectScreenMap: [],
  collectionScreenMap: [],
  papers: [],
  projects: [],
  collections: [],
  members: [],
  lastMembersFetch: 0,

  upsertToProjects: (incoming) =>
    set((s) => {
      const updatedProjects = [...s.projects];
      const updatedMap = [...s.projectScreenMap];

      for (const p of incoming) {
        const idx = updatedProjects.findIndex((x) => x.projectId === p.projectId);
        if (idx >= 0) {
          updatedProjects[idx] = p;
        } else {
          updatedProjects.push(p);
        }
        const mapIdx = updatedMap.findIndex((x) => x.projectId === p.projectId);
        if (mapIdx >= 0) {
          updatedMap[mapIdx] = { ...updatedMap[mapIdx], lastFetched: Date.now() };
        } else {
          updatedMap.push({
            lastFetched: Date.now(),
            projectId: p.projectId,
            paperIdArray: [],
            collectionIdArray: [],
          });
        }
      }

      return { projects: updatedProjects, projectScreenMap: updatedMap };
    }),

  upsertToCollections: (incoming) =>
    set((s) => {
      const updatedCollections = [...s.collections];
      const updatedMap = [...s.collectionScreenMap];

      for (const c of incoming) {
        const idx = updatedCollections.findIndex((x) => x.collectionId === c.collectionId);
        if (idx >= 0) {
          updatedCollections[idx] = c;
        } else {
          updatedCollections.push(c);
        }
        const mapIdx = updatedMap.findIndex((x) => x.collectionId === c.collectionId);
        if (mapIdx >= 0) {
          updatedMap[mapIdx] = { ...updatedMap[mapIdx], lastFetched: Date.now() };
        } else {
          updatedMap.push({
            lastFetched: Date.now(),
            collectionId: c.collectionId,
            paperIdArray: [],
          });
        }
      }

      return { collections: updatedCollections, collectionScreenMap: updatedMap };
    }),

  upsertToPapers: (incoming) =>
    set((s) => {
      const updatedPapers = [...s.papers];

      for (const p of incoming) {
        const idx = updatedPapers.findIndex((x) => x.paperId === p.paperId);
        if (idx >= 0) {
          updatedPapers[idx] = p;
        } else {
          updatedPapers.push(p);
        }
      }

      const addedPaperIds = incoming.map((p) => p.paperId);
      const updatedProjectScreenMap = [...s.projectScreenMap];
      const updatedCollectionScreenMap = [...s.collectionScreenMap];

      for (const p of incoming) {
        if (p.projectId) {
          const mapIdx = updatedProjectScreenMap.findIndex(
            (x) => x.projectId === p.projectId
          );
          if (mapIdx >= 0) {
            updatedProjectScreenMap[mapIdx] = {
              ...updatedProjectScreenMap[mapIdx],
              paperIdArray: [
                ...new Set([
                  ...updatedProjectScreenMap[mapIdx].paperIdArray,
                  ...addedPaperIds,
                ]),
              ],
            };
          } else {
            updatedProjectScreenMap.push({
              lastFetched: 0,
              projectId: p.projectId,
              paperIdArray: [...addedPaperIds],
              collectionIdArray: [],
            });
          }
        }
        if (p.collectionId) {
          const mapIdx = updatedCollectionScreenMap.findIndex(
            (x) => x.collectionId === p.collectionId
          );
          if (mapIdx >= 0) {
            updatedCollectionScreenMap[mapIdx] = {
              ...updatedCollectionScreenMap[mapIdx],
              paperIdArray: [
                ...new Set([
                  ...updatedCollectionScreenMap[mapIdx].paperIdArray,
                  ...addedPaperIds,
                ]),
              ],
            };
          } else {
            updatedCollectionScreenMap.push({
              lastFetched: 0,
              collectionId: p.collectionId,
              paperIdArray: [...addedPaperIds],
            });
          }
        }
      }

      return {
        papers: updatedPapers,
        projectScreenMap: updatedProjectScreenMap,
        collectionScreenMap: updatedCollectionScreenMap,
      };
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
