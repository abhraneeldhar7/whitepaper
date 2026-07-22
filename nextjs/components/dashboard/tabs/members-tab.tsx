import { useDashboardStore } from "@/lib/zustand/store";
import { Skeleton } from "@/components/ui/skeleton";
import MemberCard from "../member-card";

function MembersTabLoading() {
  return (
    <div className="p-4 space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-3 border rounded-md space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-5 w-40" />
        </div>
      ))}
    </div>
  );
}

export default function MembersTab() {
  const isLoading = useDashboardStore((s) => s.isLoading);
  const members = useDashboardStore((s) => s.members);
  const workspace = useDashboardStore((s) => s.workspace);
  const projects = useDashboardStore((s) => s.projects);
  const collections = useDashboardStore((s) => s.collections);
  const papers = useDashboardStore((s) => s.papers);

  if (isLoading) return <MembersTabLoading />;

  const resolveEntityName = (
    entityType: string,
    entityId: string
  ): string => {
    switch (entityType) {
      case "workspace":
        return workspace?.workspaceName ?? "Unknown Workspace";
      case "project":
        return (
          projects.find((p) => p.projectId === entityId)?.name ??
          "Unknown Project"
        );
      case "collection":
        return (
          collections.find((c) => c.collectionId === entityId)?.name ??
          "Unknown Collection"
        );
      case "paper":
        return (
          papers.find((p) => p.paperId === entityId)?.title ??
          "Unknown Paper"
        );
      default:
        return "Unknown";
    }
  };

  if (members.length === 0) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground text-sm">No members yet.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {members.map((m) => (
        <MemberCard
          key={`${m.membership.userId}-${m.membership.entityId}`}
          member={m}
          entityName={resolveEntityName(
            m.membership.entityType,
            m.membership.entityId
          )}
        />
      ))}
    </div>
  );
}
