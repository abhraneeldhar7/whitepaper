"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { uploadPaperImage } from "@/lib/api/services/papers";
import { compressImage } from "@/lib/image";
import { BANNER_MAX_HEIGHT_PIXELS, BANNER_MAX_WIDTH_PIXELS } from "@/shared/constants";
import { Spinner } from "@/components/ui/spinner";

export interface PaperImageAttrs {
  src: string | null;
  alt: string | null;
  title: string | null;
  status: "uploading" | "done";
}

function PaperImageNodeView({ node, updateAttributes, extension }: NodeViewProps) {
  const alt = node.attrs.alt ?? "";
  const uploading = node.attrs.status === "uploading";
  const [isUploading, setIsUploading] = useState(uploading);
  const [imgSrc, setImgSrc] = useState(node.attrs.src ?? "");

  useEffect(() => {
    if (!uploading) return;

    const paperId = extension.options.paperId as string;
    if (!paperId) return;

    fetch(imgSrc)
      .then((r) => r.blob())
      .then((blob) =>
        compressImage({
          file: blob,
          maxWidth: BANNER_MAX_WIDTH_PIXELS,
          maxHeight: BANNER_MAX_HEIGHT_PIXELS,
          crop: false,
        })
      )
      .then((compressed) => uploadPaperImage(paperId, compressed as Blob))
      .then((result) => {
        URL.revokeObjectURL(imgSrc);
        setImgSrc(result.url);
        setIsUploading(false);
        updateAttributes({ src: result.url, status: "done" });
      })
      .catch(() => {
        URL.revokeObjectURL(imgSrc);
      });
  }, []);

  return (
    <NodeViewWrapper>
      <div className="relative w-full rounded-sm overflow-hidden my-6">
        <Image
          src={imgSrc}
          alt={alt}
          width={2000}
          height={2000}
          className={`w-full object-cover object-center max-h-[350px] rounded-sm overflow-hidden transition-all ease-out ${isUploading ? "blur-[30px]" : "blur-[0px]"}`}
          unoptimized
        />
        {isUploading && (
          <div className="absolute bottom-2 right-2 z-[2]">
            <span className="flex gap-2 items-center text-xs bg-background px-2 py-1 rounded-xs">
              <Spinner size={12} /> Uploading
            </span>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const PaperImage = Node.create({
  name: "paperImage",
  group: "block",
  draggable: true,
  selectable: true,
  atom: true,

  addOptions() {
    return {
      paperId: "",
    };
  },

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      status: { default: "done" },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="paper-image"]',
        getAttrs: (element) => {
          const el = element as HTMLElement;
          const img = el.querySelector("img");
          return {
            src: img?.getAttribute("src") ?? null,
            alt: img?.getAttribute("alt") ?? null,
            title: img?.getAttribute("title") ?? null,
            status: "done",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, alt, title, ...rest } = HTMLAttributes;
    return [
      "div",
      mergeAttributes(rest, { "data-type": "paper-image" }),
      ["img", mergeAttributes({ src: src || "", alt: alt || "", title: title || "" })],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PaperImageNodeView);
  },
});
