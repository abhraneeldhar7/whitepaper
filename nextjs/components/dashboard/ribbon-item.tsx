"use client"

export function RibbonItemSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-[30px] w-[30px] rounded-sm bg-muted-foreground/20 animate-pulse" />
      <div className="h-4 w-32 bg-muted-foreground/20 rounded animate-pulse" />
    </div>
  );
}
