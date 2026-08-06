"use client";

import { Button } from "@/components/ui/button";
import type { Paper } from "@/shared/types";
import { ChevronRight, ImageUpIcon, SidebarIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { compressImage } from "@/lib/image";
import { removeThumbnail, savePaper } from "@/lib/api/services/papers";
import { BANNER_MAX_HEIGHT_PIXELS, BANNER_MAX_WIDTH_PIXELS } from "@/shared/constants";
import PaperThumbnailUpload from "@/components/editor/paper-thumbnail-upload";
import "@/components/markdown-render/markdown-render.css";
import "@/components/editor/editor.css";

import { SITE_CONTENT_MAX_WIDTH } from "@/lib/design";

export default function PaperEditor({ paper }: { paper?: Paper }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = 260;
  const [paperState, setPaperState] = useState<Paper | undefined>(paper);
  const [newThumbnail, setNewThumbnail] = useState<string | null>(null);
  const [newThumbFile, setNewThumbFile] = useState<File | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCoverChange = useCallback(async (file: File | null) => {
    if (!file || !paperState) return;
    setNewThumbFile(file);

    try {
      const compressed = await compressImage({
        file,
        maxWidth: BANNER_MAX_WIDTH_PIXELS,
        maxHeight: BANNER_MAX_HEIGHT_PIXELS,
        crop: false,
      });

      const previewUrl = URL.createObjectURL(compressed as Blob);
      setNewThumbnail(previewUrl);

      const result = await savePaper({ paperId: paperState.paperId, thumbnail: compressed as Blob });
      if (result.thumbnailUrl) {
        URL.revokeObjectURL(previewUrl);
        setNewThumbnail(null);
        setNewThumbFile(null);
        setPaperState((prev) => prev ? { ...prev, thumbnailUrl: result.thumbnailUrl! } : prev);
      }
    } catch {
      setNewThumbFile(null);
      setNewThumbnail(null);
    }
  }, [paperState]);

  const handleRemoveCover = useCallback(() => {
    if (!paperState) return;
    setPaperState((prev) => prev ? { ...prev, thumbnailUrl: null } : prev);
    removeThumbnail(paperState.paperId);
  }, [paperState]);

  const handleSave = useCallback(async () => {
    if (!paperState) return;

    const title = titleRef.current?.value;
    const content = "";

    try {
      const result = await savePaper({
        paperId: paperState.paperId,
        title,
        content,
      });

      if (result.publicSlug) {
        window.history.replaceState(null, "", `/p/${result.publicSlug}`);
        setPaperState((prev) => prev ? { ...prev, publicSlug: result.publicSlug!, isNew: false } : prev);
      }
    } catch {
      // silently fail
    }
  }, [paperState]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);


  return (
    <div className={`p-1 md:p-2 bg-muted flex h-[100vh] w-full transition-all ${sidebarOpen ? "md:gap-2" : "md:gap-0"}`}>
      <div className="relative overflow-hidden h-full transition-all ease-out" style={{ width: sidebarOpen ? sidebarWidth : 0 }}>
        <div className="absolute top-0 h-full left-0" style={{ width: sidebarWidth }}>
        </div>
      </div>
      <div className="rounded-md border bg-background h-full flex-1 p-1">
        <div className="flex gap-1 items-center p-1">
          <Button variant="secondary" className="mr-2" size="icon" onClick={() => { setSidebarOpen(!sidebarOpen) }}><SidebarIcon /></Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <button className="text-base text-foreground/70 cursor-pointer hover:text-foreground transition-all h-9 sm:h-8 px-2 rounded-xs">Lorem ipsum dolor sit</button>
        </div>

        <div className="flex justify-center w-full mt-5">
          <div className=" w-full" style={{ width: SITE_CONTENT_MAX_WIDTH + 20 }}>
            <div className="group markdownDiv space-y-2">
              <div className="h-9 flex items-end">
                {!(newThumbnail || paperState?.thumbnailUrl) && <Button variant="secondary" size="sm" className="md:opacity-0 group-hover:opacity-100" onClick={() => fileInputRef.current?.click()}><ImageUpIcon />Add Cover</Button>}
              </div>
              <h1 className="mt-[2] px-[9px]" >
                <textarea
                  rows={1}
                  ref={titleRef}
                  className="outline-0 shadow-0 border-0 w-full resize-none overflow-hidden"
                  defaultValue={paperState?.title || "New Paper"}
                  onInput={(e) => {
                    const el = e.currentTarget;
                    el.style.height = "auto";
                    el.style.height = el.scrollHeight + 4 + "px";
                  }} />
              </h1>
            </div>

            <div className="px-[10px] mt-4">
              <PaperThumbnailUpload
                icon={<ImageUpIcon />}
                text="Change Cover"
                value={newThumbFile}
                className="max-h-[400px] rounded-md"
                preview={(newThumbnail || paperState?.thumbnailUrl)}
                onChange={handleCoverChange}>
                {(newThumbnail || paperState?.thumbnailUrl) && (
                  <Button variant="secondary" className="absolute top-3 right-3 z-[3] md:opacity-0 group-hover:opacity-100" onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveCover();
                  }}>Remove <XIcon /></Button>
                )}
              </PaperThumbnailUpload>
              <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={(e) => handleCoverChange(e.target.files?.[0] || null)} />
            </div>




          </div>
        </div>
      </div>
    </div>
  );
}
