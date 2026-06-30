import type {
  ContentType,
  ContentItem,
  ContentDetail,
  Platform,
  PlatformDetail,
  Category,
  Article,
  SearchResult,
  ApiResponse,
  PaginatedResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { ...init?.headers as Record<string, string> };

  // Only set Content-Type for requests with a body (POST/PUT/PATCH)
  if (init?.body) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}/public${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }

  return res.json();
}

// ── Content Types ──

export async function fetchContentTypes(): Promise<ContentType[]> {
  const res = await fetchApi<ApiResponse<ContentType[]>>("/content-types");
  return res.data;
}

// ── Content ──

export interface ContentQuery {
  page?: number;
  limit?: number;
  platform?: string;
  sort?: "newest" | "title" | "downloads" | "popularity";
  search?: string;
  filters?: Record<string, string>;
}

export async function fetchContentByType(
  typeSlug: string,
  query: ContentQuery = {},
): Promise<{ data: ContentItem[]; pagination: PaginatedResponse<ContentItem>["pagination"] }> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.platform) params.set("platform", query.platform);
  if (query.sort) params.set("sort", query.sort);
  if (query.search) params.set("search", query.search);
  if (query.filters) {
    for (const [key, value] of Object.entries(query.filters)) {
      params.set(`filter[${key}]`, value);
    }
  }

  const qs = params.toString();
  const res = await fetchApi<PaginatedResponse<ContentItem>>(`/content/by-type/${typeSlug}${qs ? `?${qs}` : ""}`);
  return { data: res.data, pagination: res.pagination };
}

export async function fetchContentBySlug(slug: string): Promise<ContentDetail> {
  const res = await fetchApi<ApiResponse<ContentDetail>>(`/content/${slug}`);
  return res.data;
}

// ── Platforms ──

export async function fetchPlatforms(): Promise<Platform[]> {
  const res = await fetchApi<ApiResponse<Platform[]>>("/platforms");
  return res.data;
}

export async function fetchPlatformBySlug(slug: string): Promise<PlatformDetail> {
  const res = await fetchApi<ApiResponse<PlatformDetail>>(`/platforms/${slug}`);
  return res.data;
}

// ── Categories ──

export async function fetchCategories(typeSlug?: string): Promise<Category[]> {
  const qs = typeSlug ? `?type=${typeSlug}` : "";
  const res = await fetchApi<ApiResponse<Category[]>>(`/categories${qs}`);
  return res.data;
}

// ── Articles ──

export async function fetchArticles(): Promise<Article[]> {
  const res = await fetchApi<ApiResponse<Article[]>>("/articles");
  return res.data;
}

export async function fetchArticleBySlug(slug: string): Promise<Article> {
  const res = await fetchApi<ApiResponse<Article>>(`/articles/${slug}`);
  return res.data;
}

// ── Search ──

export async function searchContent(query: string): Promise<SearchResult> {
  const res = await fetchApi<ApiResponse<SearchResult>>(`/search?q=${encodeURIComponent(query)}`);
  return res.data;
}

// ── Settings ──

export async function fetchSettings(): Promise<Record<string, string>> {
  const res = await fetchApi<ApiResponse<Record<string, string>>>("/settings");
  return res.data;
}

// ── Server-side ISR fetch (used by server components) ──

async function fetchApiISR<T>(path: string, revalidate = 60, tags?: string[]): Promise<T> {
  const res = await fetch(`${API_BASE}/public${path}`, {
    next: { revalidate, tags },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }
  return res.json();
}

export async function fetchContentTypesServer(): Promise<ContentType[]> {
  const res = await fetchApiISR<ApiResponse<ContentType[]>>("/content-types", 60, ["content-types"]);
  return res.data;
}

export async function fetchContentByTypeServer(
  typeSlug: string,
  query: ContentQuery = {},
): Promise<{ data: ContentItem[]; pagination: PaginatedResponse<ContentItem>["pagination"] }> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.platform) params.set("platform", query.platform);
  if (query.sort) params.set("sort", query.sort);
  if (query.search) params.set("search", query.search);
  if (query.filters) {
    for (const [key, value] of Object.entries(query.filters)) {
      params.set(`filter[${key}]`, value);
    }
  }
  const qs = params.toString();
  const res = await fetchApiISR<PaginatedResponse<ContentItem>>(`/content/by-type/${typeSlug}${qs ? `?${qs}` : ""}`, 60, ["content", `content-type-${typeSlug}`]);
  return { data: res.data, pagination: res.pagination };
}

export async function fetchContentBySlugServer(slug: string): Promise<ContentDetail> {
  const res = await fetchApiISR<ApiResponse<ContentDetail>>(`/content/${slug}`, 120, ["content", `content-${slug}`]);
  return res.data;
}

export async function fetchPlatformsServer(): Promise<Platform[]> {
  const res = await fetchApiISR<ApiResponse<Platform[]>>("/platforms", 120, ["platforms"]);
  return res.data;
}

export async function fetchPlatformBySlugServer(slug: string): Promise<PlatformDetail> {
  const res = await fetchApiISR<ApiResponse<PlatformDetail>>(`/platforms/${slug}`, 60, ["platforms", `platform-${slug}`]);
  return res.data;
}

export async function fetchCategoriesServer(typeSlug?: string): Promise<Category[]> {
  const qs = typeSlug ? `?type=${typeSlug}` : "";
  const res = await fetchApiISR<ApiResponse<Category[]>>(`/categories${qs}`, 60, ["categories"]);
  return res.data;
}

export async function fetchArticlesServer(): Promise<Article[]> {
  const res = await fetchApiISR<ApiResponse<Article[]>>("/articles", 60, ["articles"]);
  return res.data;
}

export async function fetchArticleBySlugServer(slug: string): Promise<Article> {
  const res = await fetchApiISR<ApiResponse<Article>>(`/articles/${slug}`, 120, ["articles", `article-${slug}`]);
  return res.data;
}

export async function fetchSettingsServer(): Promise<Record<string, string>> {
  const res = await fetchApiISR<ApiResponse<Record<string, string>>>("/settings", 300, ["settings"]);
  return res.data;
}

// ── Downloads ──

export async function fetchDownloadUrl(slug: string): Promise<{ downloadUrl: string; fileName: string }> {
  const res = await fetchApi<ApiResponse<{ downloadUrl: string; fileName: string }>>(`/content/${slug}/download`);
  return res.data;
}

// ── Forms ──

export async function submitContentRequest(data: { title: string; platform: string }): Promise<{ id: string; message: string }> {
  const res = await fetchApi<ApiResponse<{ id: string; message: string }>>("/requests", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function submitContactForm(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ id: string; message: string }> {
  const res = await fetchApi<ApiResponse<{ id: string; message: string }>>("/contact", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

