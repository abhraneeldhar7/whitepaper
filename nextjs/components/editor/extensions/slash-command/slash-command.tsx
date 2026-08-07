import { Node, mergeAttributes, type Editor } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import { SlashCommandList } from "./slash-command-list";


export interface SlashCommandItem {
  title: string;
  icon: string;
  keywords?: string[];
  command: (props: {
    editor: Editor;
    range: { from: number; to: number };
  }) => void;
}

export const SUGGESTION_ITEMS: SlashCommandItem[] = [
  {
    title: "Heading 1",
    icon: "heading-1",
    keywords: ["h1"],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 1 })
        .run();
    },
  },
  {
    title: "Heading 2",
    icon: "heading-2",
    keywords: ["h2"],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 2 })
        .run();
    },
  },
  {
    title: "Heading 3",
    icon: "heading-3",
    keywords: ["h3"],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 3 })
        .run();
    },
  },
  {
    title: "Paragraph",
    icon: "type",
    keywords: ["p", "text"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("paragraph").run();
    },
  },
  {
    title: "Bullet List",
    icon: "list",
    keywords: ["ul", "unordered"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Ordered List",
    icon: "list-ordered",
    keywords: ["ol", "numbered"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Blockquote",
    icon: "quote",
    keywords: ["quote"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Code Block",
    icon: "code",
    keywords: ["code"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: "Image",
    icon: "image",
    keywords: ["img", "picture"],
    command: ({ editor, range }) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const blobUrl = URL.createObjectURL(file);
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContentAt(range.from, [
            { type: "paperImage", attrs: { src: blobUrl, status: "uploading" } },
            { type: "paragraph" },
          ])
          .run();
      };
      input.click();
    },
  },
  {
    title: "Table",
    icon: "table",
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    title: "Horizontal Rule",
    icon: "minus",
    keywords: ["hr", "divider"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: "Voice Note",
    icon: "mic",
    command: () => {},
  },
];

export const SlashCommand = Node.create({
  name: "slashCommand",
  group: "inline",
  inline: true,
  atom: true,
  addAttributes() {
    return { id: { default: null } };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="slash-command"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "slash-command" }),
      "@",
    ];
  },
  addInputRules() {
    return [];
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: "/",
        allowSpaces: false,
        items: ({ query }: { query: string }) => {
          return SUGGESTION_ITEMS.filter((item) => {
            const q = query.toLowerCase();
            if (item.title.toLowerCase().includes(q)) return true;
            if (item.keywords?.some((k) => k.toLowerCase().includes(q))) return true;
            return false;
          });
        },
        render: () => {
          let component: any;
          let popup: HTMLElement;

          return {
            onStart: (props: any) => {
              component = new ReactRenderer(SlashCommandList, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) return;

              popup = document.createElement("div");
              popup.style.position = "absolute";
              popup.style.zIndex = "50";
              document.body.appendChild(popup);

              const rect = props.clientRect();
              popup.style.left = `${rect.left}px`;
              popup.style.top = `${rect.bottom + 4}px`;

              popup.appendChild(component.element);
            },
            onUpdate(props: any) {
              component?.updateProps(props);
              if (!props.clientRect) return;
              const rect = props.clientRect();
              popup.style.left = `${rect.left}px`;
              popup.style.top = `${rect.bottom + 4}px`;
            },
            onKeyDown(props: any) {
              if (props.event.key === "Escape") {
                popup?.remove();
                component?.destroy();
                return true;
              }
              return component?.ref?.onKeyDown?.(props.event) ?? false;
            },
            onExit() {
              popup?.remove();
              component?.destroy();
            },
          };
        },
        command: (props: any) => {
          const { editor, range, props: itemProps } = props;
          const item = SUGGESTION_ITEMS.find(
            (i) => i.title === itemProps.title
          );
          if (item) {
            item.command({ editor, range });
          }
        },
      }),
    ];
  },
});
