import { api } from "@/lib/api/api-client";
import { PRIVATE } from "@/lib/api/endpoints";
import type { User } from "@/lib/types";

export function getMe(token: string): Promise<User> {
  return api.get<User>(PRIVATE.ME, { token });
}
