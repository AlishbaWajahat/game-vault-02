"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { getCache, setCache } from "@/lib/page-cache";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";

interface SharedContentItem {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  isPublished: boolean;
  downloads: number;
  platform: string[];
  siteNames: string[];
  contentType: { id: string; slug: string; name: string };
  updatedAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function SharedContentPage() {
  const _cached = getCache<{ items: SharedContentItem[]; pagination: PaginationData }>("shared-content");
  const [items, setItems] = useState<SharedContentItem[]>(_cached?.items ?? []);
  const [pagination, setPagination] = useState<PaginationData | null>(_cached?.pagination ?? null);
  const [loading, setLoading] = useState(!_cached);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [assigning, setAssigning] = useState<string | null>(null);

  async function loadData(p = page, s = search) {
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: "20",
      });
      if (s) params.set("search", s);

      const res = await api<{
        success: boolean;
        data: SharedContentItem[];
        pagination: PaginationData;
      }>(`/admin/content/shared?${params}`);

      setItems(res.data);
      setPagination(res.pagination);
      setCache("shared-content", { items: res.data, pagination: res.pagination });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadData(1, search);
  }

  function goToPage(p: number) {
    setPage(p);
    loadData(p, search);
  }

  async function handleAssign(item: SharedContentItem) {
    setAssigning(item.id);
    try {
      await api(`/admin/content/${item.id}/assign`, { method: "POST" });
      toast.success(`"${item.title}" added to your site`);
      // Remove from list
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      if (pagination) {
        setPagination({ ...pagination, total: pagination.total - 1 });
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add");
    } finally {
      setAssigning(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <h1 className="text-lg md:text-2xl font-bold">Shared Library</h1>
        <Card>
          <CardContent className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 md:space-y-6">
        <h1 className="text-lg md:text-2xl font-bold">Shared Library</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-lg md:text-2xl font-bold">Shared Library</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Content available in the shared database that is not yet on your
          site. Add items to your site without creating duplicates.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <Input
          placeholder="Search shared content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit" variant="outline" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {/* Results */}
      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">
                {search
                  ? "No shared content matches your search."
                  : "All content in the shared database is already on your site."}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.coverImage && (
                      <img
                        src={item.coverImage}
                        alt=""
                        className="h-12 w-12 rounded object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge variant="outline">
                          {item.contentType.name}
                        </Badge>
                        {item.platform.map((p) => (
                          <Badge
                            key={p}
                            variant="secondary"
                          >
                            {p}
                          </Badge>
                        ))}
                        <span className="text-[10px] text-muted-foreground">
                          On: {item.siteNames.join(", ")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAssign(item)}
                    disabled={assigning === item.id}
                  >
                    {assigning === item.id ? (
                      "Adding..."
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Add to My Site
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(page + 1)}
            disabled={page >= pagination.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
