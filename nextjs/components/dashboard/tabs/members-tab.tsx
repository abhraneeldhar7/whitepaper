import { useDashboardStore } from "@/lib/zustand/store";
import MemberCard from "../member-card";

export default function MembersTab() {
  const members = useDashboardStore((s) => s.members);
  const projects = useDashboardStore((s) => s.projects);
  const collections = useDashboardStore((s) => s.collections);
  const papers = useDashboardStore((s) => s.papers);

  const resolveEntityName = (
    entityType: string,
    entityId: string
  ): string => {
    switch (entityType) {
      case "workspace":
        return "Workspace";
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
