"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { resolveDashboard, type DashboardResponse } from "@/lib/api/services/workspace";

const LAST_VISITED_KEY = "lastVisitedWorkspaceId";

interface DashboardContextType {
  workspace: DashboardResponse["workspace"] | null;
  papers: DashboardResponse["papers"];
  projects: DashboardResponse["projects"];
  workspaceRole: string | null;
  projectRoles: Record<string, string>;
  paperRoles: Record<string, string>;
  loading: boolean;
  error: string | null;
  setWorkspaceId: (id: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken, isSignedIn } = useAuth();

  const [workspace, setWorkspace] = useState<DashboardResponse["workspace"] | null>(null);
  const [papers, setPapers] = useState<DashboardResponse["papers"]>([]);
  const [projects, setProjects] = useState<DashboardResponse["projects"]>([]);
  const [workspaceRole, setWorkspaceRole] = useState<string | null>(null);
  const [projectRoles, setProjectRoles] = useState<Record<string, string>>({});
  const [paperRoles, setPaperRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(
    async (workspaceId?: string) => {
      if (!isSignedIn) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const token = await getToken();
        if (!token) throw new Error("No auth token");

        const res = await resolveDashboard(token, workspaceId);

        // Redirect case — workspaceId was inaccessible
        if (res.error && res.redirectTo) {
          setError(res.error);
          localStorage.setItem(LAST_VISITED_KEY, res.redirectTo);
          // Redirect after showing toast briefly
          setTimeout(() => {
            router.push(`/dashboard?workspaceId=${res.redirectTo}`);
          }, 2000);
          return;
        }

        // No workspaces at all
        if (res.error) {
          setError(res.error);
          setLoading(false);
          return;
        }

        // Success
        setWorkspace(res.workspace || null);
        setPapers(res.papers || []);
        setProjects(res.projects || []);
        setWorkspaceRole(res.workspace_role);
        setProjectRoles(res.project_roles);
        setPaperRoles(res.paper_roles);

        if (res.workspaceId) {
          localStorage.setItem(LAST_VISITED_KEY, res.workspaceId);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [isSignedIn, getToken, router]
  );

  useEffect(() => {
    const paramWorkspaceId = searchParams.get("workspaceId");
    const lastVisited = localStorage.getItem(LAST_VISITED_KEY);
    const initialId = paramWorkspaceId || lastVisited || undefined;
    fetchDashboard(initialId);
  }, [fetchDashboard, searchParams]);

  const setWorkspaceId = useCallback(
    (id: string) => {
      localStorage.setItem(LAST_VISITED_KEY, id);
      router.push(`/dashboard?workspaceId=${id}`);
    },
    [router]
  );

  return (
    <DashboardContext.Provider
      value={{
        workspace,
        papers,
        projects,
        workspaceRole,
        projectRoles,
        paperRoles,
        loading,
        error,
        setWorkspaceId,
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
