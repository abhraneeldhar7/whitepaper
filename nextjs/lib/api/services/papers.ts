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
  return client.get<{ paper: Paper, role: string } | null>(
    PRIVATE.PAPER_BY_ID,
    { query: { paperId } },
  ).then(r => r ? { ...r.paper, role: r.role } as PaperWithRole : null);
}
