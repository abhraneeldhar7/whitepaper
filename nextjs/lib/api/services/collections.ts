import { apiClient, type ApiClient } from "@/lib/api/api-client";
import { PRIVATE } from "@/lib/api/endpoints";
import type { Collection } from "@/shared/types";
import type { PaperWithRole } from "@/lib/api/services/workspace";

export interface CollectionWithRole {
  role: string;
  data: Collection;
}

export interface CollectionScreenData {
  papers: PaperWithRole[];
}

export function fetchCollectionScreen(
  collectionId: string,
  client: ApiClient = apiClient,
): Promise<CollectionScreenData> {
  return client.get<CollectionScreenData>(PRIVATE.SCREEN_COLLECTION, {
    query: { collectionId },
  });
}

export function fetchCollectionById(
  collectionId: string,
  client: ApiClient = apiClient,
): Promise<CollectionWithRole | null> {
  return client.get<{ role: string; data: Collection } | null>(
    PRIVATE.COLLECTION_BY_ID + "/" + collectionId,
  );
}

export function getCollectionBySlug(
  projectId: string,
  slug: string,
  client: ApiClient = apiClient,
): Promise<CollectionWithRole | null> {
  return client.get<{ role: string; data: Collection } | null>(
    PRIVATE.COLLECTION_BY_SLUG + "/" + slug,
    { query: { projectId } },
  );
}
