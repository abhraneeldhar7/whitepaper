"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import Typography from "@tiptap/extension-typography";
import Link from "@tiptap/extension-link";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Dropcursor from "@tiptap/extension-dropcursor";
import Gapcursor from "@tiptap/extension-gapcursor";
import { common, createLowlight } from "lowlight";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

import { SlashCommand } from "./extensions/slash-command/slash-command";
import { PaperImage } from "./extensions/paper-image/paper-image";
import { EditorBubbleMenu } from "./editor-bubble-menu";
import { EditorTableToolbar } from "./editor-table-toolbar";

import "./editor.css";

const lowlight = createLowlight(common);

const ActivePlaceholder = Extension.create({
  name: "activePlaceholder",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("activePlaceholder"),
        props: {
          decorations(state) {
            if (!state.selection.empty) return DecorationSet.empty;
            const node = state.selection.$from.parent;
            if (!node.type.isTextblock || node.content.size > 0) return DecorationSet.empty;
            const pos = state.selection.$from.before();
            return DecorationSet.create(state.doc, [
              Decoration.node(pos, pos + node.nodeSize, { "data-placeholder": "Type '/' for commands..." })
            ]);
          },
        },
      }),
    ];
  },
});

export interface EditorProps {
  content?: string;
  onChange?: (html: string) => void;
  onBlur?: () => void;
  paperId?: string;
  className?: string;
}

export function Editor({
  content = "",
  onChange,
  onBlur,
  paperId,
  className,
}: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      ActivePlaceholder,
      Highlight,
      Underline,
      Typography,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "editor-link" },
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Table.configure({ resizable: true, cellMinWidth: 150 }),
      TableRow,
      TableCell,
      TableHeader,
      Dropcursor.configure({ color: "var(--primary)", width: 2 }),
      Gapcursor,
      SlashCommand,
      PaperImage.configure({ paperId: paperId ?? "" }),
    ],
    content,
    editorProps: {
      attributes: { class: "markdownDiv tiptap outline-none focus:outline-none min-h-[200px] p-0" },
    },
    onUpdate: ({ editor: e }) => {
      onChange?.(e.getHTML());
    },
    onBlur: () => {
      onBlur?.();
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content]);


  if (!editor) return null;

  return (
    <div className={className}>
      <div className="relative">
        <EditorContent editor={editor} />
        <EditorTableToolbar editor={editor} />
        {editor.isEditable && <EditorBubbleMenu editor={editor} />}
        <div
          className="h-[40vh] w-full"
          onClick={() => editor.commands.focus('end')}
        ></div>
      </div>
    </div>
  );
}
