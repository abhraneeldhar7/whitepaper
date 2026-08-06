import { apiClient, type ApiClient } from "@/lib/api/api-client";
import { PRIVATE } from "@/lib/api/endpoints";
import type { Paper } from "@/shared/types";

export interface PaperWithRole {
  role: string;
  data: Paper;
}

export function fetchPaperById(
  paperId: string,
  withContent: boolean = false,
  client: ApiClient = apiClient,
): Promise<PaperWithRole | null> {
  return client.get<{ role: string; data: Paper } | null>(
    `${PRIVATE.PAPER_BY_ID}/${paperId}`,
    { query: { withContent } },
  );
}

export function getPaperBySlug(
  slug: string,
  withContent: boolean = false,
  client: ApiClient = apiClient,
): Promise<PaperWithRole | null> {
  return client.get<{ role: string; data: Paper } | null>(
    `${PRIVATE.PAPER_BY_SLUG}/${slug}`,
    { query: { withContent } },
  );
}

export function createPaper(
  workspaceId: string,
  projectId: string | null = null,
  collectionId: string | null = null,
  client: ApiClient = apiClient,
): Promise<PaperWithRole | null> {
  return client.post<PaperWithRole>(PRIVATE.PAPER_CREATE, {
    query: { workspaceId, projectId, collectionId },
  });
}

export interface SavePaperResponse {
  success: true;
  thumbnailUrl?: string;
  publicSlug?: string;
}

export interface SavePaperParams {
  paperId: string;
  title?: string;
  content?: string;
  thumbnail?: File | Blob;
}

export function savePaper(
  { paperId, title, content, thumbnail }: SavePaperParams,
  client: ApiClient = apiClient,
): Promise<SavePaperResponse> {
  const formData = new FormData();
  if (title !== undefined) formData.set("title", title);
  if (content !== undefined) formData.set("content", content);
  if (thumbnail) formData.set("thumbnail", thumbnail, "cover");

  return client.post<SavePaperResponse>(PRIVATE.PAPER_SAVE, {
    body: formData,
    query: { paperId },
  });
}

export interface RemoveThumbnailResponse {
  success: boolean;
}

export function removeThumbnail(
  paperId: string,
  client: ApiClient = apiClient,
): Promise<RemoveThumbnailResponse> {
  return client.post<RemoveThumbnailResponse>(PRIVATE.PAPER_REMOVE_THUMBNAIL, {
    query: { paperId },
  });
}
