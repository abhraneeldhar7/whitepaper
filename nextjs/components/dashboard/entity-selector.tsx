"use client"

import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import ContainerLogo from "@/components/container-logo";
import type { Workspace } from "@/shared/types";
import type { ProjectWithRole, CollectionWithRole } from "@/lib/api/services/workspace";
import { Check } from "lucide-react";

function getEntityId(
  entity: Workspace | ProjectWithRole | CollectionWithRole,
  entityType: "workspace" | "project" | "collection",
): string {
  switch (entityType) {
    case "workspace":
      return (entity as Workspace).workspaceId;
    case "project":
      return (entity as ProjectWithRole).data.projectId;
    case "collection":
      return (entity as CollectionWithRole).data.collectionId;
  }
}

function getEntityName(entity: Workspace | ProjectWithRole | CollectionWithRole): string {
  if ("workspaceName" in entity) return entity.workspaceName;
  return entity.data.name;
}

function getEntityLogoUrl(entity: Workspace | ProjectWithRole | CollectionWithRole): string | null {
  if ("data" in entity && "logoUrl" in entity.data) return entity.data.logoUrl ?? null;
  return null;
}

type EntitySelectorProps =
  | {
    imageUrl?: string | null;
    entity: Workspace | null;
    entityType: "workspace";
    items: Workspace[];
    onSelect: (entity: Workspace) => void;
    disabled?: boolean;
  }
  | {
    imageUrl?: string | null;
    entity: ProjectWithRole | null;
    entityType: "project";
    items: ProjectWithRole[];
    onSelect: (entity: ProjectWithRole) => void;
    disabled?: boolean;
  }
  | {
    imageUrl?: string | null;
    entity: CollectionWithRole | null;
    entityType: "collection";
    items: CollectionWithRole[];
    onSelect: (entity: CollectionWithRole) => void;
    disabled?: boolean;
  };

export default function EntitySelector({
  imageUrl,
  entity,
  entityType,
  items,
  onSelect,
  disabled,
}: EntitySelectorProps) {
  const handleValueChange = useCallback(
    (val: string) => {
      const found = items.find((item) => getEntityId(item, entityType) === val);
      if (found) onSelect(found as never);
    },
    [items, entityType, onSelect],
  );

  if (!entity) return null;

  const entityId = getEntityId(entity, entityType);

  return (
    <Select onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger className="p-0 rounded-sm pr-3 border-0 group !outline-none !ring-0 !ring-offset-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 transition-all hover:bg-background/70 border-transparent border-1 hover:border-border">
        <div className="p-1 px-0 group-hover:pl-1 transition-all rounded-sm flex items-center gap-3">
          <ContainerLogo
            imageUrl={imageUrl ?? getEntityLogoUrl(entity) ?? null}
            name={getEntityName(entity)}
          />
          <div className="text-foreground/80 group-hover:text-foreground text-base h-full flex items-center truncate rounded-xs transition-all">{getEntityName(entity)}</div>
        </div>
      </SelectTrigger>
      <SelectContent className="min-w-48" position="popper">
        <SelectGroup>
          {items.map((item) => {
            const id = getEntityId(item, entityType);
            const name = getEntityName(item);
            const logoUrl = getEntityLogoUrl(item);
            const isActive = id === entityId;
            return (
              <SelectItem key={id} value={id}>
                <ContainerLogo imageUrl={logoUrl} name={name} />
                {name}
                {isActive && <Check className="ml-auto size-4" />}
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
