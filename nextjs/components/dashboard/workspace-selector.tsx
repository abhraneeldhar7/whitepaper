"use client";

import { useEffect, useState } from "react";
import { ChevronsUpDown, Check } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDashboard, useDashboardStore } from "./dashboard-provider";
import { listWorkspaces, type WorkspaceItem } from "@/lib/api/services/workspace";

export default function WorkspaceSelector() {
  const { setWorkspaceId } = useDashboard();
  const workspace = useDashboardStore((s) => s.workspace);
  const { getToken } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchWorkspaces() {
      try {
        setLoading(true);
        const token = await getToken();
        if (!token) return;
        const list = await listWorkspaces(token);
        setWorkspaces(list);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchWorkspaces();
  }, [getToken]);

  if (!workspace) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="hover:bg-background/80 gap-3" variant="ghost">
          <Image
            src="/images/appLogo.png"
            className="rounded-sm"
            alt=""
            height={30}
            width={30}
            unoptimized
          />
          <p className="text-base">{workspace.workspaceName}</p>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.workspaceId}
            onClick={() => setWorkspaceId(ws.workspaceId)}
          >
            <Check
              className={`mr-2 h-4 w-4 ${
                ws.workspaceId === workspace.workspaceId
                  ? "opacity-100"
                  : "opacity-0"
              }`}
            />
            {ws.workspaceName}
          </DropdownMenuItem>
        ))}
        {workspaces.length === 0 && !loading && (
          <DropdownMenuItem disabled>No workspaces</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
