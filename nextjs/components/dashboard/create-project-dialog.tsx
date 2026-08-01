"use client";

import { useState, useEffect } from "react";
import { EyeIcon, ImageIcon, ImageUpIcon, LoaderCircle, LockIcon, PanelTopIcon } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "@/components/dashboard/image-upload";
import { ApiError } from "@/lib/api/api-client";
import { createProject, checkProjectSlug } from "@/lib/api/services/projects";
import { useDashboardStore } from "@/lib/zustand/store";
import { compressImage } from "@/lib/image";
import { useDebounce } from "@/hooks/useDebounce";
import { LOGO_MAX_WIDTH_PIXELS, LOGO_MAX_HEIGHT_PIXELS, BANNER_MAX_WIDTH_PIXELS, BANNER_MAX_HEIGHT_PIXELS } from "@/lib/constants";

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function CreateProjectDialog({ open, onClose }: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [publicSlug, setPublicSlug] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [logo, setLogo] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const workspaceId = useDashboardStore((s) => s.activeWorkspace?.workspaceId);

  const debouncedSlug = useDebounce(publicSlug, 400);

  useEffect(() => {
    if (!debouncedSlug.trim() || !workspaceId) {
      setSlugStatus("idle");
      return;
    }
    let cancelled = false;
    setSlugStatus("checking");
    checkProjectSlug(workspaceId, debouncedSlug.trim()).then(({ available }) => {
      if (!cancelled) setSlugStatus(available ? "available" : "taken");
    }).catch(() => {
      if (!cancelled) setSlugStatus("idle");
    });
    return () => { cancelled = true; };
  }, [debouncedSlug, workspaceId]);

  const nameValid = name.trim().length >= 1 && name.length <= 20;
  const descriptionValid = description.length <= 200;
  const slugValid = publicSlug.trim().length > 0 && slugStatus !== "taken" && slugStatus !== "checking";
  const canSubmit = nameValid && descriptionValid && slugValid && !loading;

  function handleNameBlur() {
    if (!publicSlug.trim() && name.trim()) {
      const slug = slugify(name);
      setPublicSlug(slug);
    }
  }

  function reset() {
    setName("");
    setPublicSlug("");
    setDescription("");
    setVisibility("private");
    setLogo(null);
    setBanner(null);
    setSlugStatus("idle");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleCreate() {
    if (!canSubmit || !workspaceId) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("workspaceId", workspaceId);
      formData.append("name", name.trim());
      formData.append("publicSlug", publicSlug.trim());
      formData.append("description", description.trim());
      formData.append("visibility", visibility);
      if (logo) {
        const compressed = await compressImage({
          file: logo,
          maxWidth: LOGO_MAX_WIDTH_PIXELS,
          maxHeight: LOGO_MAX_HEIGHT_PIXELS,
          crop: true,
        });
        formData.append("logo", compressed, logo.name);
      }
      if (banner) {
        const compressed = await compressImage({
          file: banner,
          maxWidth: BANNER_MAX_WIDTH_PIXELS,
          maxHeight: BANNER_MAX_HEIGHT_PIXELS,
        });
        formData.append("banner", compressed, banner.name);
      }

      const result = await createProject(formData);

      useDashboardStore.getState().upsertToProjects([{ ...result.project, role: "owner" }]);
      toast.success("Project created");
      handleClose();
    } catch (e) {
      if (e instanceof ApiError) {
        try { toast.error(JSON.parse(e.message)?.detail || e.message); }
        catch { toast.error(e.message); }
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <div className="relative cursor-pointer">
            {!banner &&
              <p className="z-[2] absolute top-3 left-2 select-none"><span className="border px-2 py-1 mr-2 bg-background rounded-xs">Upload</span> Project banner <ImageUpIcon className="inline ml-2 opacity-80" size={14} /></p>
            }
            <ImageUpload className="w-full h-[200px]" value={banner} onChange={setBanner} />
          </div>
          <div className="absolute z-[2] bottom-[-30px] left-[50%] translate-x-[-50%]">
            <div className="relative">
              <ImageUpload icon={<ImageUpIcon />} text="Project logo" className={`w-[120px] h-[120px] bg-popover rounded-md ${logo && "border-popover"}`} value={logo} onChange={setLogo} />
            </div>
          </div>
        </div>

        <div className="space-y-1 mt-8">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} onBlur={handleNameBlur} maxLength={20} />
          {name.length > 0 && !nameValid && <p className="text-xs text-destructive">Name must be 1-20 characters</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="slug">Public slug</Label>
          <Input id="slug" placeholder="my-project" value={publicSlug} onChange={(e) => setPublicSlug(e.target.value)} />
          {slugStatus === "checking" && (
            <p className="text-xs text-muted-foreground"><LoaderCircle className="inline animate-spin size-[12px] mr-1" /> Checking availability...</p>
          )}
          {slugStatus === "available" && (
            <p className="text-xs text-green-600">Slug available</p>
          )}
          {slugStatus === "taken" && (
            <p className="text-xs text-destructive">Slug already taken</p>
          )}
        </div>

        <div>
          <div className="space-y-1">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" placeholder="Short description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
            <p className="text-[0.7rem] text-muted-foreground text-right">{description.length}/200</p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="visibility" className="cursor-pointer">Visibility</Label>
            <Button className="w-full sm:w-fit justify-center sm:justify-start" variant="secondary" onClick={() => setVisibility(visibility == "private" ? "public" : "private")} size="sm">{visibility == "private" ? <><LockIcon /> Private</> : <><EyeIcon /> Public </>}</Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!canSubmit} loading={loading}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
