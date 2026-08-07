"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  Heading1,
  Heading2,
  Heading3,
  Type,
  List,
  ListOrdered,
  Quote,
  Code,
  Image,
  Table,
  Minus,
  Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SUGGESTION_ITEMS, type SlashCommandItem } from "./slash-command";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "heading-1": Heading1,
  "heading-2": Heading2,
  "heading-3": Heading3,
  type: Type,
  list: List,
  "list-ordered": ListOrdered,
  quote: Quote,
  code: Code,
  image: Image,
  table: Table,
  minus: Minus,
  mic: Mic,
};

interface SlashCommandListProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export interface SlashCommandListRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

export const SlashCommandList = forwardRef<
  SlashCommandListRef,
  SlashCommandListProps
>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.children[selectedIndex] as HTMLElement | undefined;
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index];
      if (item) command(item);
    },
    [items, command]
  );

  useImperativeHandle(ref, () => ({
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((i) => (i + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="z-50 w-64 rounded-lg border bg-popover p-1.5 text-popover-foreground shadow-md">
        <p className="px-2 py-1.5 text-sm text-muted-foreground">
          No results
        </p>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className="z-50 w-64 rounded-lg border bg-popover p-1.5 text-popover-foreground shadow-md"
    >
      {items.map((item, index) => {
        const Icon = ICON_MAP[item.icon] || Type;
        return (
          <button
            key={item.title}
            type="button"
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              index === selectedIndex && "bg-accent text-accent-foreground"
            )}
            onClick={() => selectItem(index)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <Icon className="size-4 shrink-0" />
            <span>{item.title}</span>
          </button>
        );
      })}
    </div>
  );
});

SlashCommandList.displayName = "SlashCommandList";
