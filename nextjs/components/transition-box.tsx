"use client";

import { cn } from "@/lib/utils";

export function TransitionBox({
  active = false,
  children,
  className,
}: {
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "transition-all overflow-hidden duration-slow ease-out",
        active ? "w-full opacity-100 max-h-[800px]" : "w-0 opacity-0 max-h-0",
        className
      )}
    >
      {children}
    </div>
  );
}
