"use client";

import { Button } from "@/components/ui/button";
import type { Paper } from "@/shared/types";
import { ChevronRight, ImageUpIcon, SidebarIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { compressImage } from "@/lib/image";
import { removeThumbnail, savePaper, uploadThumbnail } from "@/lib/api/services/papers";
import { BANNER_MAX_HEIGHT_PIXELS, BANNER_MAX_WIDTH_PIXELS } from "@/shared/constants";
import { Editor } from "@/components/editor/editor";
import EditorFileTree from "@/components/editor/editor-filetree";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { useDashboardStore } from "@/lib/zustand/store";
import "@/components/markdown-render/markdown-render.css";
import "@/components/editor/editor.css";

import { SITE_CONTENT_MAX_WIDTH } from "@/lib/design";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import ImageUpload from "@/components/dashboard/image-upload";

export default function PaperEditor({ paper }: { paper?: Paper }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = 260;
  const [currentPaper, setCurrentPaper] = useState(paper);
  const [originalPaper, setOriginalPaper] = useState(paper);
  const [newThumbnailUrl, setNewThumbnailUrl] = useState<string | null>(null);
  const [contentState, setContentState] = useState(paper?.content ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const currentPaperRef = useRef(currentPaper);
  const contentRef = useRef(contentState);
  const originalPaperRef = useRef(originalPaper);
  const savingRef = useRef(false);
  const pendingSaveRef = useRef(false);

  const { resolveWorkspaceScreen } = useDashboard()
  const workspaceId = useDashboardStore((s) => s.activeWorkspace?.workspaceId);

  useEffect(() => {
    if (!workspaceId) return;
    resolveWorkspaceScreen();
  }, [workspaceId]);

  currentPaperRef.current = currentPaper;
  contentRef.current = contentState;
  originalPaperRef.current = originalPaper;

  async function performSave() {
    if (savingRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    const p = currentPaperRef.current;
    if (!p) return;

    const title = (titleRef.current?.value ?? "").trim();
    const content = contentRef.current.trim();
    const origTitle = (originalPaperRef.current?.title ?? "").trim();
    const origContent = (originalPaperRef.current?.content ?? "").trim();

    const titleChanged = title !== origTitle;
    const contentChanged = content !== origContent;
    if (!titleChanged && !contentChanged) return;

    savingRef.current = true;
    setIsSaving(true);

    try {
      const result = await savePaper({
        paperId: p.paperId,
        ...(titleChanged && { title }),
        ...(contentChanged && { content }),
      });

      if (result.publicSlug) {
        window.history.replaceState(null, "", `/p/${result.publicSlug}`);
        setCurrentPaper(prev => prev ? { ...prev, publicSlug: result.publicSlug!, isNew: false } : prev);
        setOriginalPaper(prev => prev ? { ...prev, publicSlug: result.publicSlug!, isNew: false } : prev);
      }
      if (titleChanged) setOriginalPaper(prev => prev ? { ...prev, title } : prev);
      if (contentChanged) setOriginalPaper(prev => prev ? { ...prev, content } : prev);
    } catch {
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }

    if (pendingSaveRef.current) {
      pendingSaveRef.current = false;
      performSave();
    }
  }

  async function handleCoverChange(file: File | null) {
    if (!file || !currentPaper) return;
    // console.log("cover upload");
    const previewUrl = URL.createObjectURL(file);
    setNewThumbnailUrl(previewUrl);
    setIsSaving(true);

    try {
      const compressed = await compressImage({
        file,
        maxWidth: BANNER_MAX_WIDTH_PIXELS,
        maxHeight: BANNER_MAX_HEIGHT_PIXELS,
        crop: false,
      });
      const result = await uploadThumbnail(currentPaper.paperId, compressed as Blob);
      setNewThumbnailUrl(null);
      setCurrentPaper(prev => prev ? { ...prev, thumbnailUrl: result.thumbnailUrl } : prev);
      setOriginalPaper(prev => prev ? { ...prev, thumbnailUrl: result.thumbnailUrl } : prev);
      URL.revokeObjectURL(previewUrl);
    } catch {
      setNewThumbnailUrl(null);
      URL.revokeObjectURL(previewUrl);
    } finally {
      setIsSaving(false);
    }
  }

  function handleRemoveCover() {
    const p = currentPaperRef.current;
    if (!p || !p.thumbnailUrl) return;
    console.log("[save] cover remove");
    setCurrentPaper(prev => prev ? { ...prev, thumbnailUrl: null } : prev);
    setOriginalPaper(prev => prev ? { ...prev, thumbnailUrl: null } : prev);
    removeThumbnail(p.paperId);
  }

  function handleTitleBlur() {
    console.log("[save] title blur");
    clearTimeout(saveTimerRef.current);
    performSave();
  }

  function handleContentChange(html: string) {
    setContentState(html);
    clearTimeout(saveTimerRef.current);
    const trimmed = html.trim();
    const original = (originalPaperRef.current?.content ?? "").trim();
    if (trimmed === original) return;
    saveTimerRef.current = setTimeout(() => performSave(), 2000);
  }

  function handleEditorBlur() {
    clearTimeout(saveTimerRef.current);
    performSave();
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        clearTimeout(saveTimerRef.current);
        console.log("[save] ctrl+s");
        performSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className={`p-1 md:p-2 bg-muted flex h-svh w-full transition-all ${sidebarOpen ? "md:gap-2" : "md:gap-0"}`}>
      <div className="hidden md:flex relative overflow-hidden h-full transition-all ease-out" style={{ width: sidebarOpen ? sidebarWidth : 0 }}>
        <div className="absolute top-0 h-full left-0 overflow-y-auto" style={{ width: sidebarWidth }}>
          <EditorFileTree paper={currentPaper} />
        </div>
      </div>
      <div className="rounded-md border bg-background min-h-0 flex-1 flex flex-col overflow-hidden p-1">
        <div className="flex gap-4 items-center p-1 shrink-0 justify-between">
          <div className="flex items-center gap-1">
            <Button variant="secondary" className="mr-2" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}><SidebarIcon /></Button>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <button className="text-base text-foreground/70 cursor-pointer hover:text-foreground transition-all h-9 sm:h-8 px-2 rounded-xs">Lorem ipsum dolor sit</button>
          </div>
          <div className="flex items-center gap-1 h-full">
            {isSaving &&
              <span className="text-xs font-[450] rounded-[20px] py-[3px] px-[10px] animate-pulse">Saving ...</span>
            }
          </div>
        </div>

        <ScrollArea className="flex-1 overflow-hidden">
          <div className="flex justify-center w-full mt-5">
            <div className="w-full" style={{ maxWidth: SITE_CONTENT_MAX_WIDTH + 20 }}>
              <div className="group space-y-2">
                <div className="h-9 flex items-end">
                  {!(newThumbnailUrl || currentPaper?.thumbnailUrl) && (
                    <Button variant="secondary" size="sm" className="md:opacity-0 group-hover:opacity-100" onClick={() => fileInputRef.current?.click()}>
                      <ImageUpIcon />Add Cover
                    </Button>
                  )}
                </div>
                <div className="markdownDiv">
                  <h1 className="mt-[2] px-[9px]">
                    <textarea
                      rows={1}
                      ref={titleRef}
                      className="outline-0 shadow-0 border-0 w-full resize-none overflow-hidden bg-transparent text-foreground"
                      defaultValue={currentPaper?.title || "New Paper"}
                      style={{ lineHeight: 1.5, fontSize: "inherit" }}
                      onBlur={handleTitleBlur}
                      onInput={(e) => {
                        const el = e.currentTarget;
                        el.style.height = "auto";
                        el.style.height = el.scrollHeight + "px";
                      }}
                    />
                  </h1>
                </div>
              </div>

              <div className="px-[10px] mt-3">
                {(newThumbnailUrl || currentPaper?.thumbnailUrl) &&
                  <ImageUpload value={null}
                    preview={newThumbnailUrl || currentPaper?.thumbnailUrl}
                    onChange={handleCoverChange}>
                    <div className="absolute top-1 right-1 bg-background p-[2px] rounded-xs z-[3] md:opacity-0 group-hover:opacity-100 flex gap-[2px] items-center">
                      <Button size="sm" variant="secondary"><ImageUpIcon /> Click or drag & drop</Button>
                      <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handleRemoveCover(); }}>Remove <XIcon /></Button>
                    </div>
                  </ImageUpload>
                }
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={(e) => handleCoverChange(e.target.files?.[0] || null)} />
              </div>

              <div className="px-[10px] mt-8 markdownDiv">
                <Editor
                  content={contentState}
                  paperId={currentPaper?.paperId}
                  onChange={handleContentChange}
                  onBlur={handleEditorBlur}
                />
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
