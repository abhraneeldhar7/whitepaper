"use client";

import { useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { ImageIcon, UploadIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  icon?: React.ReactNode;
  text?: string;
  value: File | null;
  preview?: string | null;
  onChange: (file: File | null) => void;
  className?: string;
}

export default function ImageUpload({ icon, text, value, preview, onChange, className }: ImageUploadProps) {
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    onDrop: (files) => onChange(files[0] || null),
  });

  const previewUrl = useMemo(() => {
    if (value) return URL.createObjectURL(value);
    if (preview) return preview;
    return null;
  }, [value, preview]);

  useEffect(() => {
    if (!value || !previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [value, previewUrl]);

  const hasImage = previewUrl || value;

  return (
    <div {...getRootProps()} className={cn("relative group cursor-pointer rounded-sm border border-border transition-colors", isDragActive && "border-primary", className)}>
      <input {...getInputProps()} />
      {hasImage ? (
        <div className="relative aspect-video overflow-hidden rounded-sm">
          <img src={previewUrl!} alt={text} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className={cn("flex flex-col items-center justify-center gap-2.5 w-full h-full aspect-video rounded-sm bg-input/30 transition-all hover:bg-input/50", isDragActive && "bg-primary/10")}>
          <span className="text-foreground/70 [&_svg:not([class*='size-'])]:size-[20px]">{icon}</span>
          <span className="text-xs text-foreground/80">{text}</span>
        </div>
      )}
    </div>
  );
}
