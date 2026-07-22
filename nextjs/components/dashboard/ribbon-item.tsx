"use client"

import { ChevronDown, ChevronRight } from "lucide-react";
import WorkspaceLogo from "@/components/workspace-logo";

interface RibbonItemProps {
  logo?: string | null;
  name: string;
  chevron?: "down" | "right";
}

export function RibbonItem({ logo, name, chevron }: RibbonItemProps) {
  return (
    <div className="flex items-center gap-2">
      <WorkspaceLogo src={logo} name={name} />
      <span className="text-base font-medium">{name}</span>
      {chevron === "down" && <ChevronDown className="h-4 w-4 opacity-50" />}
      {chevron === "right" && <ChevronRight className="h-4 w-4 opacity-50" />}
    </div>
  );
}

export function RibbonItemSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-[30px] w-[30px] rounded-sm bg-muted-foreground/20 animate-pulse" />
      <div className="h-4 w-32 bg-muted-foreground/20 rounded animate-pulse" />
    </div>
  );
}
