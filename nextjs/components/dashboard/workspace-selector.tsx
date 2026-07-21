"use client";

import { ChevronsUpDown } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useDashboard } from "./dashboard-provider";

export default function WorkspaceSelector() {
  const { workspace } = useDashboard();

  if (!workspace) return null;

  return (
    <div className="flex gap-3 items-center">
      <Image
        src="/images/appLogo.png"
        className="rounded-sm"
        alt=""
        height={30}
        width={30}
        unoptimized
      />
      <p className="text-base">{workspace.workspaceName}</p>
      <Button
        className="hover:bg-background/80"
        variant="ghost"
        size="icon-xs"
      >
        <ChevronsUpDown />
      </Button>
    </div>
  );
}
