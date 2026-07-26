import { apiClient, type ApiClient } from "@/lib/api/api-client";
import { PRIVATE } from "@/lib/api/endpoints";
import type { Paper } from "@/lib/types";

export interface PaperWithRole extends Paper {
  role: string;
}

export function fetchPaperById(
  paperId: string,
  client: ApiClient = apiClient,
): Promise<PaperWithRole | null> {
  return client.get<PaperWithRole | null>(
    PRIVATE.PAPER_BY_ID,
    { query: { paperId } },
  );
}
