// Types matching backend API response shapes

export interface ContentType {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description: string;
}

export interface ContentItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  isPublished: boolean;
  contentTypeId: string;
  downloads: number;
  popularity: number;
  platform: string[];
  fields: Record<string, any>;
  totalFileSize?: string;
  contentType?: { id: string; slug: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface FieldDefinition {
  id: string;
  slug: string;
  name: string;
  fieldType: string;
  group: string;
  sortOrder: number;
  showInList: boolean;
  showInDetail: boolean;
  isFilterable: boolean;
  isSortable: boolean;
  isRequired: boolean;
  options?: string[];
  validation?: Record<string, any>;
  defaultValue?: any;
  placeholder?: string;
}

export interface ContentDetail extends ContentItem {
  fieldDefinitions: FieldDefinition[];
  contentType: { id: string; slug: string; name: string };
  files: { id: string; fileName: string; fileSize: string }[];
}

export interface Platform {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  color: string | null;
  classic: boolean;
  sortOrder: number;
  count: number;
  contentTypes: { id: string; slug: string; name: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface PlatformDetail extends Omit<Platform, "count"> {
  contents: ContentItem[];
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description: string | null;
  contentTypeId: string | null;
  contentType: { id: string; slug: string; name: string } | null;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  image: string;
  category: string;
  author: string;
  date: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContentRequest {
  id: string;
  title: string;
  platform: string;
  status: string;
  createdAt: string;
}

export interface SearchResult {
  content: ContentItem[];
  articles: Article[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// Platform color metadata (kept client-side since these are display-only)
export const PLATFORM_COLORS: Record<string, { color: string; colorLight: string; colorBg: string }> = {
  pc:          { color: "#3B82F6", colorLight: "#60A5FA", colorBg: "rgba(59,130,246,0.12)" },
  switch:      { color: "#EF4444", colorLight: "#F87171", colorBg: "rgba(239,68,68,0.12)" },
  playstation: { color: "#2563EB", colorLight: "#3B82F6", colorBg: "rgba(37,99,235,0.12)" },
  xbox:        { color: "#22C55E", colorLight: "#4ADE80", colorBg: "rgba(34,197,94,0.12)" },
  gba:         { color: "#7C3AED", colorLight: "#A78BFA", colorBg: "rgba(124,58,237,0.12)" },
  snes:        { color: "#6366F1", colorLight: "#818CF8", colorBg: "rgba(99,102,241,0.12)" },
  n64:         { color: "#F59E0B", colorLight: "#FBBF24", colorBg: "rgba(245,158,11,0.12)" },
  nds:         { color: "#06B6D4", colorLight: "#22D3EE", colorBg: "rgba(6,182,212,0.12)" },
  psp:         { color: "#8B5CF6", colorLight: "#A78BFA", colorBg: "rgba(139,92,246,0.12)" },
  dreamcast:   { color: "#F97316", colorLight: "#FB923C", colorBg: "rgba(249,115,22,0.12)" },
  wii:         { color: "#14B8A6", colorLight: "#2DD4BF", colorBg: "rgba(20,184,166,0.12)" },
  ps2:         { color: "#1D4ED8", colorLight: "#3B82F6", colorBg: "rgba(29,78,216,0.12)" },
};

export function getPlatformColors(slug: string) {
  return PLATFORM_COLORS[slug] ?? { color: "#468284", colorLight: "#4fb38c", colorBg: "rgba(70,130,132,0.12)" };
}
