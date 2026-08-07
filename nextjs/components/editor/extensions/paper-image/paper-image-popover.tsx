"use client";

import React, { useRef, useState } from "react";
import { type Editor } from "@tiptap/react";
import { ChevronDown, Copy, Download, ImageIcon, Link2, Pencil, Text, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PaperImagePopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt: string;
  title: string;
  editor: Editor;
  onReplace: (file: File) => void;
  onRemove: () => void;
  onEditCaption: (caption: string) => void;
  onEditAltText: (altText: string) => void;
}

export function PaperImagePopover({
  open,
  onOpenChange,
  src,
  alt,
  title,
  editor,
  onReplace,
  onRemove,
  onEditCaption,
  onEditAltText,
}: PaperImagePopoverProps) {
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  const [showAltInput, setShowAltInput] = useState(false);
  const captionRef = useRef<HTMLInputElement>(null);
  const altRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReplace = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onReplace(file);
      onOpenChange(false);
    }
    e.target.value = "";
  };

  const handleCopyImage = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
    } catch {
      // fallback: copy URL
      await navigator.clipboard.writeText(src);
    }
    onOpenChange(false);
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = src;
    a.download = src.split("/").pop() || "image";
    a.click();
    onOpenChange(false);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(src);
    onOpenChange(false);
  };

  const handleSaveCaption = () => {
    const value = captionRef.current?.value ?? "";
    onEditCaption(value);
    setShowCaptionInput(false);
    onOpenChange(false);
  };

  const handleSaveAlt = () => {
    const value = altRef.current?.value ?? "";
    onEditAltText(value);
    setShowAltInput(false);
    onOpenChange(false);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            size="icon-sm"
            className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronDown className="size-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-52 p-1" sideOffset={4}>
          {showCaptionInput ? (
            <div className="p-2 space-y-2">
              <Label className="text-xs">Caption</Label>
              <Input ref={captionRef} defaultValue={alt} placeholder="Add a caption..." onKeyDown={(e) => e.key === "Enter" && handleSaveCaption()} autoFocus />
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => setShowCaptionInput(false)}>Cancel</Button>
                <Button size="sm" onClick={handleSaveCaption}>Save</Button>
              </div>
            </div>
          ) : showAltInput ? (
            <div className="p-2 space-y-2">
              <Label className="text-xs">Alt text</Label>
              <Input ref={altRef} defaultValue={title} placeholder="Describe the image..." onKeyDown={(e) => e.key === "Enter" && handleSaveAlt()} autoFocus />
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => setShowAltInput(false)}>Cancel</Button>
                <Button size="sm" onClick={handleSaveAlt}>Save</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <button
                type="button"
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                onClick={handleReplace}
              >
                <ImageIcon className="size-4" />
                <span>Replace</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                onClick={handleCopyImage}
              >
                <Copy className="size-4" />
                <span>Copy image</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                onClick={handleDownload}
              >
                <Download className="size-4" />
                <span>Download</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                onClick={handleCopyLink}
              >
                <Link2 className="size-4" />
                <span>Copy link</span>
              </button>
              <div className="my-1 h-px bg-border" />
              <button
                type="button"
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                onClick={() => setShowCaptionInput(true)}
              >
                <Pencil className="size-4" />
                <span>Edit caption</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                onClick={() => setShowAltInput(true)}
              >
                <Text className="size-4" />
                <span>Alt text</span>
              </button>
              <div className="my-1 h-px bg-border" />
              <button
                type="button"
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent text-destructive hover:text-destructive-foreground hover:bg-destructive"
                onClick={() => { onRemove(); onOpenChange(false); }}
              >
                <Trash2 className="size-4" />
                <span>Remove</span>
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
}
