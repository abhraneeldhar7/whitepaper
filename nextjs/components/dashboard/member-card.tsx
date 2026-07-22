import Image from "next/image";
import type { MemberWithUser } from "@/lib/types";

interface MemberCardProps {
  member: MemberWithUser;
  entityName: string;
}

export default function MemberCard({ member, entityName }: MemberCardProps) {
  const { user, membership } = member;

  return (
    <div className="flex flex-col gap-2 p-3 border rounded-md">
      <div className="flex items-center gap-3">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.name}
            width={40}
            height={40}
            className="rounded-full"
            unoptimized
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted-foreground/20 flex items-center justify-center text-sm font-medium">
            {user.name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
        )}
        <div>
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div>
        <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
          {membership.role} of {entityName}
        </span>
      </div>
    </div>
  );
}
