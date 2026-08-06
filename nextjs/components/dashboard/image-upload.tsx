"use client";

import { useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ImageUploadProps {
  icon?: React.ReactNode;
  text?: string;
  value: File | null;
  preview?: string | null;
  onChange: (file: File | null) => void;
  className?: string;
  children?: React.ReactNode;
}

export default function ImageUpload({ icon, text, value, preview, onChange, className, children }: ImageUploadProps) {
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

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative w-full aspect-[5/3] rounded-sm border transition-all cursor-pointer overflow-hidden group",
        isDragActive && "border-primary",
        className,
      )}
    >
      <input {...getInputProps()} />

      {previewUrl && (
        <Image src={previewUrl} height={2000} width={2000} className="w-full h-full object-cover object-center group-hover:blur-[20px] group-hover:opacity-80 duraiton-fast transition-all" alt="" />
      )}

      <div
        className={cn(
          "top-0 left-0 h-full w-full flex items-center justify-center flex-col gap-2.5 bg-background/35 transition-opacity",
          previewUrl ? "absolute opacity-0 hover:opacity-100" : "opacity-100",
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
