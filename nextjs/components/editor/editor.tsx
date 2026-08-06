"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
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

import { SlashCommand } from "./extensions/slash-command/slash-command";
import { PaperImage } from "./extensions/paper-image/paper-image";
import { EditorBubbleMenu } from "./editor-bubble-menu";
import { EditorTableToolbar } from "./editor-table-toolbar";

import "./editor.css";

const lowlight = createLowlight(common);

export interface EditorProps {
  content?: string;
  onChange?: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  uploadImage?: (file: File) => Promise<string>;
  className?: string;
}

export function Editor({
  content = "",
  onChange,
  onBlur,
  placeholder = "Type '/' for commands...",
  uploadImage,
  className,
}: EditorProps) {
  const uploadRef = useRef(uploadImage);
  uploadRef.current = uploadImage;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Placeholder.configure({ placeholder }),
      Highlight,
      Underline,
      Typography,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "editor-link" },
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Dropcursor.configure({ color: "var(--primary)", width: 2 }),
      Gapcursor,
      SlashCommand,
      PaperImage,     // THIS IS THE ACTUAL NAME BY TIPTAP DEVS. I AM BUILD FOR THIS SHI
    ],
    content,
    editorProps: {
      attributes: { class: "tiptap" },
    },
    onUpdate: ({ editor: e }) => {
      onChange?.(e.getHTML());
    },
    onBlur: () => {
      onBlur?.();
    },
  });

  useEffect(() => {
    if (editor && uploadRef.current) {
      (editor as any).options.uploadImage = uploadRef.current;
    }
  }, [editor, uploadImage]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content]);

  if (!editor) return null;

  const isInTable = editor.isActive("table");

  return (
    <div className={className}>
      {isInTable && <EditorTableToolbar editor={editor} />}
      <div className="relative">
        <EditorContent editor={editor} />
        {editor.isEditable && <EditorBubbleMenu editor={editor} />}
      </div>
    </div>
  );
}
