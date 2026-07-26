"use client"

import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ContainerLogo from "@/components/container-logo";

interface SelectableEntity {
  id: string;
  name: string;
  logoUrl?: string | null;
}

interface EntitySelectorProps {
  imageUrl?: string | null;
  entity: SelectableEntity | null;
  entityType: "workspace" | "project" | "collection";
  items: SelectableEntity[];
  onSelect: (id: string) => void;
  disabled?: boolean;
}

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
      if (val) onSelect(val);
    },
    [onSelect],
  );

  if (!entity) return null;

  const filtered = items.filter((item) => item.id !== entity.id);

  return (
    <Select value="" onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger className="border-0 bg-transparent hover:bg-accent px-2 gap-2 h-auto py-1.5 shadow-none text-base font-medium">
        <ContainerLogo
          imageUrl={imageUrl ?? entity.logoUrl ?? null}
          name={entity.name}
          size={24}
        />
        <SelectValue placeholder={entity.name} />
      </SelectTrigger>
      <SelectContent align="start" className="min-w-48">
        {filtered.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            <ContainerLogo imageUrl={item.logoUrl} name={item.name} size={20} />
            {item.name}
          </SelectItem>
        ))}
        {filtered.length === 0 && !disabled && (
          <p className="text-xs text-muted-foreground px-2 py-1.5">
            No other {entityType}s
          </p>
        )}
      </SelectContent>
    </Select>
  );
}
