import { apiClient, type ApiClient } from "@/lib/api/api-client";
import { PRIVATE } from "@/lib/api/endpoints";
import type { Collection } from "@/lib/types";
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
  return client.get<{ collection: Collection, role: string } | null>(
    PRIVATE.COLLECTION_BY_ID + "/" + collectionId,
  ).then(r => r ? { role: r.role, data: r.collection } as CollectionWithRole : null);
}

export function getCollectionBySlug(
  projectId: string,
  slug: string,
  client: ApiClient = apiClient,
): Promise<CollectionWithRole | null> {
  return client.get<{ collection: Collection, role: string } | null>(
    PRIVATE.COLLECTION_BY_SLUG + "/" + slug,
    { query: { projectId } },
  ).then(r => r ? { role: r.role, data: r.collection } as CollectionWithRole : null);
}
