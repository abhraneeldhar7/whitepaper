import { apiClient, type ApiClient } from "@/lib/api/api-client";
import { PRIVATE } from "@/lib/api/endpoints";
import type { User } from "@/shared/types";

export function getMe(client: ApiClient = apiClient): Promise<User> {
  return client.get<User>(PRIVATE.ME);
}

export function provisionUser(): Promise<{ status: string }> {
  return apiClient.post<{ status: string }>(PRIVATE.USER_PROVISION);
}
