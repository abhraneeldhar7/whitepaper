import { apiClient, type ApiClient } from "@/lib/api/api-client";
import { PRIVATE } from "@/lib/api/endpoints";
import type { User } from "@/lib/types";

export function getMe(client: ApiClient = apiClient): Promise<User> {
  return client.get<User>(PRIVATE.ME);
}
