"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Highlighter,
  Code,
  Strikethrough,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EditorBubbleMenuProps {
  editor: Editor;
}

const FORMAT_ITEMS = [
  {
    name: "bold" as const,
    icon: Bold,
    label: "Bold",
    shortcut: "Ctrl+B",
    action: (editor: Editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    name: "italic" as const,
    icon: Italic,
    label: "Italic",
    shortcut: "Ctrl+I",
    action: (editor: Editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    name: "underline" as const,
    icon: Underline,
    label: "Underline",
    shortcut: "Ctrl+U",
    action: (editor: Editor) => editor.chain().focus().toggleUnderline().run(),
  },
  {
    name: "strike" as const,
    icon: Strikethrough,
    label: "Strikethrough",
    shortcut: "Ctrl+Shift+X",
    action: (editor: Editor) => editor.chain().focus().toggleStrike().run(),
  },
  {
    name: "code" as const,
    icon: Code,
    label: "Code",
    shortcut: "Ctrl+E",
    action: (editor: Editor) => editor.chain().focus().toggleCode().run(),
  },
  {
    name: "highlight" as const,
    icon: Highlighter,
    label: "Highlight",
    shortcut: "Ctrl+Shift+H",
    action: (editor: Editor) => editor.chain().focus().toggleHighlight().run(),
  },
] as const;

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const { state } = editor.view;
    const { from, to } = state.selection;

    if (from === to || state.selection.$from.nodeAfter?.type.name === "paperImage") {
      setVisible(false);
      return;
    }

    const { view } = editor;
    const start = view.coordsAtPos(from);
    const end = view.coordsAtPos(to);

    const editorEl = view.dom.closest(".tiptap");
    if (!editorEl) return;
    const editorRect = editorEl.getBoundingClientRect();

    const top = start.top - editorRect.top - 48;
    const left = (start.left + end.left) / 2 - editorRect.left;

    setPosition({ top, left });
    setVisible(true);
  }, [editor]);

  useEffect(() => {
    const { view } = editor;

    const handleSelectionUpdate = () => {
      requestAnimationFrame(updatePosition);
    };

    view.dom.addEventListener("mouseup", handleSelectionUpdate);
    view.dom.addEventListener("keyup", handleSelectionUpdate);
    document.addEventListener("mousedown", (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    });

    return () => {
      view.dom.removeEventListener("mouseup", handleSelectionUpdate);
      view.dom.removeEventListener("keyup", handleSelectionUpdate);
    };
  }, [editor, updatePosition]);

  if (!visible) return null;

  return (
    <TooltipProvider>
      <div
        ref={menuRef}
        className="absolute z-10 -translate-x-1/2"
        style={{ top: position.top, left: position.left }}
      >
        <div className="flex items-center gap-0.5 rounded-xs border bg-popover p-[2px] shadow-md">
          {FORMAT_ITEMS.map((item) => (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => item.action(editor)}
                  className="size-8 p-0 rounded-xs"
                >
                  <item.icon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="rounded-[20px]">
                <span>{item.label}</span>
                <span className="ml-1.5 text-muted-foreground">
                  {item.shortcut}
                </span>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
