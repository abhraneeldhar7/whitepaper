"use client";

import { useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface PaperThumbnailUploadProps {
  icon?: React.ReactNode;
  text?: string;
  value: File | null;
  preview?: string | null;
  onChange: (file: File | null) => void;
  className?: string;
  children?: React.ReactNode;
}

export default function PaperThumbnailUpload({ icon, text, value, preview, onChange, className, children }: PaperThumbnailUploadProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
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

  const hasPreview = Boolean(previewUrl);

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative w-full rounded-sm border cursor-pointer overflow-hidden group",
        hasPreview || isDragActive
          ? "aspect-[3/2] max-h-[400px]"
          : "aspect-[3/2] max-h-[50px] hidden md:flex opacity-0",
        isDragActive && "border-primary opacity-100 bg-primary/20",
        className,
      )}
      style={{ transition: "max-height 0.3s ease-out" }}
    >
      <input {...getInputProps()} />

      {previewUrl && (
        <Image src={previewUrl} height={2000} width={2000} className="w-full h-full object-cover object-center" alt="" />
      )}

      <div
        className={cn(
          "inset-0 flex items-center justify-center flex-col gap-2.5 backdrop-blur-[40px] transition-all w-full h-full",
          previewUrl ? "absolute opacity-0 hover:opacity-100" : "opacity-100 ",
          isDragActive && "opacity-100"
        )}
      >
        <span className="text-foreground [&_svg:not([class*='size-'])]:size-[24px]">{icon}</span>
        <span className="text-sm font-[450] text-foreground">{text}</span>
      </div>
      {children}
    </div>
  );
}
