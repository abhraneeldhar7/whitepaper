const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface ApiOptions extends RequestInit {
  token?: string;
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string, options?: ApiOptions) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>(path, { ...options, method: "POST", body: body ? JSON.stringify(body) : undefined }),

  patch: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    request<T>(path, { ...options, method: "PATCH", body: body ? JSON.stringify(body) : undefined }),

  delete: <T>(path: string, options?: ApiOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
