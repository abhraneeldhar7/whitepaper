type RequestMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
type QueryPrimitive = string | number | boolean | null | undefined;

const REQUEST_TIMEOUT_MS = 30000;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export type QueryParams = Record<string, QueryPrimitive | QueryPrimitive[]>;

export type RequestOptions = {
  body?: unknown;
  query?: QueryParams;
  headers?: HeadersInit;
};

export type ApiClient = {
  get: <T>(path: string, options?: RequestOptions) => Promise<T>;
  post: <T>(path: string, options?: RequestOptions) => Promise<T>;
  patch: <T>(path: string, options?: RequestOptions) => Promise<T>;
  put: <T>(path: string, options?: RequestOptions) => Promise<T>;
  delete: <T>(path: string, options?: RequestOptions) => Promise<T>;
};

type ApiRequestOptions = RequestOptions & {
  method?: RequestMethod;
};

type TokenResolver = () => Promise<string | null>;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

function resolveApiBaseUrl(): string {
  if (API_BASE_URL) return API_BASE_URL;
  if (typeof window !== "undefined") return window.location.origin;
  throw new Error("NEXT_PUBLIC_API_BASE_URL must be configured for SSR API requests.");
}

function toRequestUrl(path: string, query?: QueryParams): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const apiBaseUrl = resolveApiBaseUrl();
  const url = new URL(normalizedPath, `${apiBaseUrl}/`);
  if (!query) return url.toString();

  for (const [key, value] of Object.entries(query)) {
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      if (item === null || item === undefined) continue;
      url.searchParams.append(key, String(item));
    }
  }

  return url.toString();
}

let _getToken: (() => Promise<string | null>) | null = null;

export function configureApiToken(getToken: () => Promise<string | null>): void {
  _getToken = getToken;
}

async function resolveClientToken(): Promise<string | null> {
  if (!_getToken) throw new Error("API token not configured. Call configureApiToken() first.");
  return _getToken();
}

function createServerTokenResolver(getToken: () => Promise<string | null>): TokenResolver {
  return getToken;
}

function createRequestClient(resolveToken: TokenResolver): ApiClient {
  async function apiRequest<T>(
    path: string,
    {
      method = "GET",
      body,
      query,
      headers,
    }: ApiRequestOptions = {},
  ): Promise<T> {
    let resolvedToken: string | null = null;
    try {
      resolvedToken = await resolveToken();
    } catch {
      resolvedToken = null;
    }

    const requestHeaders = new Headers(headers);
    requestHeaders.set("accept", "application/json");

    let requestBody: BodyInit | undefined;
    if (body instanceof FormData) {
      requestBody = body;
      requestHeaders.delete("content-type");
    } else if (
      body !== undefined &&
      body !== null &&
      !(body instanceof Blob) &&
      !(body instanceof ArrayBuffer) &&
      !ArrayBuffer.isView(body) &&
      !(typeof body === "string")
    ) {
      requestBody = JSON.stringify(body);
      requestHeaders.set("content-type", "application/json");
    } else if (body !== undefined && body !== null) {
      requestBody = body as BodyInit;
    }

    if (resolvedToken) {
      requestHeaders.set("authorization", `Bearer ${resolvedToken}`);
    } else {
      requestHeaders.delete("authorization");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(toRequestUrl(path, query), {
        method,
        headers: requestHeaders,
        body: requestBody,
        credentials: "include",
        signal: controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new NetworkError(`Request timed out after ${REQUEST_TIMEOUT_MS}ms`);
      }
      throw err;
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const message = await response.text();
      throw new ApiError(message || `Request failed with ${response.status}`, response.status);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return (await response.text()) as T;
    }

    return response.json() as Promise<T>;
  }

  return {
    get: <T>(path: string, options?: RequestOptions) =>
      apiRequest<T>(path, { method: "GET", ...options }),
    post: <T>(path: string, options?: RequestOptions) =>
      apiRequest<T>(path, { method: "POST", ...options }),
    patch: <T>(path: string, options?: RequestOptions) =>
      apiRequest<T>(path, { method: "PATCH", ...options }),
    put: <T>(path: string, options?: RequestOptions) =>
      apiRequest<T>(path, { method: "PUT", ...options }),
    delete: <T>(path: string, options?: RequestOptions) =>
      apiRequest<T>(path, { method: "DELETE", ...options }),
  };
}

export function createApiClient(tokenOrGetToken: (() => Promise<string | null>) | string | null): ApiClient {
  if (typeof tokenOrGetToken === "function") {
    return createRequestClient(createServerTokenResolver(tokenOrGetToken));
  }
  const staticToken = tokenOrGetToken;
  return createRequestClient(createServerTokenResolver(async () => staticToken));
}

export const apiClient: ApiClient = createRequestClient(resolveClientToken);
