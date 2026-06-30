"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { getCache, setCache } from "@/lib/page-cache";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Link2 } from "lucide-react";
import { toast } from "sonner";
import type { FieldDefinition } from "@/components/content/DynamicFieldRenderer";

interface ContentType {
  id: string;
  slug: string;
  name: string;
}

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  isPublished: boolean;
  downloads: number;
  platform: string[];
  siteCount: number;
  fileCount: number;
  totalFileSize: string;
  fields: Record<string, unknown>;
  updatedAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ContentListPage() {
  const params = useParams();
  const typeSlug = params.typeSlug as string;

  const _cached = getCache<{ contentType: ContentType; listFields: FieldDefinition[]; items: ContentItem[]; pagination: PaginationData }>(`content-${typeSlug}`);
  const [contentType, setContentType] = useState<ContentType | null>(_cached?.contentType ?? null);
  const [listFields, setListFields] = useState<FieldDefinition[]>(_cached?.listFields ?? []);
  const [items, setItems] = useState<ContentItem[]>(_cached?.items ?? []);
  const [pagination, setPagination] = useState<PaginationData | null>(_cached?.pagination ?? null);
  const [loading, setLoading] = useState(!_cached);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<ContentItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Unassign state
  const [unassignTarget, setUnassignTarget] = useState<ContentItem | null>(null);
  const [unassigning, setUnassigning] = useState(false);

  // Cached content type id for fast search calls
  const ctIdRef = useRef<string>("");

  // Full load: content type + fields + content (only on mount / type change)
  async function loadAll(p = 1, s = "") {
    try {
      const typesRes = await api<{ success: boolean; data: ContentType[] }>(
        "/admin/content-types",
      );
      const ct = typesRes.data.find((t) => t.slug === typeSlug);
      if (!ct) {
        setError(`Content type "${typeSlug}" not found`);
        setLoading(false);
        return;
      }
      setContentType(ct);
      ctIdRef.current = ct.id;

      const fieldsRes = await api<{ success: boolean; data: FieldDefinition[] }>(
        `/admin/content-types/${ct.id}/fields`,
      );
      setListFields(fieldsRes.data.filter((f) => f.showInList));

      const params = new URLSearchParams({ typeSlug, page: String(p), limit: "20" });
      if (s) params.set("search", s);
      const contentRes = await api<{ success: boolean; data: ContentItem[]; pagination: PaginationData }>(`/admin/content?${params}`);

      setItems(contentRes.data);
      setPagination(contentRes.pagination);
      setCache(`content-${typeSlug}`, { contentType: ct, listFields: fieldsRes.data.filter((f) => f.showInList), items: contentRes.data, pagination: contentRes.pagination });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  // Fast search: only hits the content endpoint (skips content type + fields)
  async function searchContent(p: number, s: string) {
    try {
      const params = new URLSearchParams({ typeSlug, page: String(p), limit: "20" });
      if (s) params.set("search", s);
      const contentRes = await api<{ success: boolean; data: ContentItem[]; pagination: PaginationData }>(`/admin/content?${params}`);
      setItems(contentRes.data);
      setPagination(contentRes.pagination);
    } catch (err) {
      console.error("Search failed:", err);
    }
  }

  useEffect(() => {
    const cachedForType = getCache<{ contentType: ContentType; listFields: FieldDefinition[]; items: ContentItem[]; pagination: PaginationData }>(`content-${typeSlug}`);
    if (cachedForType) {
      setContentType(cachedForType.contentType);
      setListFields(cachedForType.listFields);
      setItems(cachedForType.items);
      setPagination(cachedForType.pagination);
      ctIdRef.current = cachedForType.contentType.id;
    } else {
      setLoading(true);
    }
    setPage(1);
    setSearch("");
    loadAll(1, "");
    function onVisibilityChange() {
      if (document.visibilityState === "visible") searchContent(page, search);
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeSlug]);

  // Debounced search-as-you-type (fast — single API call)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setPage(1);
        searchContent(1, value);
      }, 200);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [typeSlug],
  );

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setPage(1);
    searchContent(1, search);
  }

  function goToPage(p: number) {
    setPage(p);
    searchContent(p, search);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/admin/content/${deleteTarget.id}`, { method: "DELETE" });
      toast.success(`"${deleteTarget.title}" deleted successfully`);
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      if (pagination) setPagination((p) => p ? { ...p, total: p.total - 1 } : null);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  async function handleUnassign() {
    if (!unassignTarget) return;
    setUnassigning(true);
    try {
      await api(`/admin/content/${unassignTarget.id}/unassign`, {
        method: "DELETE",
      });
      toast.success(`"${unassignTarget.title}" removed from this site`);
      setItems((prev) => prev.filter((i) => i.id !== unassignTarget.id));
      if (pagination) setPagination((p) => p ? { ...p, total: p.total - 1 } : null);
      setUnassignTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove");
    } finally {
      setUnassigning(false);
    }
  }

  function formatFieldValue(value: unknown): string {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) return value.join(", ");
    return String(value);
  }

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-3 md:p-6 space-y-3 md:space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 md:space-y-6">
        <h1 className="text-lg md:text-2xl font-bold">Content</h1>
        <Card>
          <CardContent className="p-3 md:p-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-lg md:text-2xl font-bold">{contentType?.name}</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
            {pagination?.total || 0} items on this site
          </p>
        </div>
        <Button asChild size="sm" className="md:h-10 md:px-4 md:text-sm">
          <Link href={`/content/${typeSlug}/new`}>
            <Plus className="h-4 w-4" />
            Add {contentType?.name || "Content"}
          </Link>
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={`Search ${contentType?.name?.toLowerCase() || "content"}...`}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">
                {search
                  ? "No results found."
                  : `No ${contentType?.name?.toLowerCase() || "content"} yet.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Platforms
                    </th>
                    {listFields.map((f) => (
                      <th
                        key={f.id}
                        className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                      >
                        {f.name}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.coverImage && (
                            <img
                              src={item.coverImage}
                              alt=""
                              className="h-10 w-10 rounded object-cover shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate max-w-[200px]">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-1">
                              <code className="text-[10px] text-muted-foreground">
                                {item.slug}
                              </code>
                              {item.siteCount > 1 && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1 py-0 gap-0.5"
                                >
                                  <Link2 className="h-2.5 w-2.5" />
                                  {item.siteCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {item.platform.map((p) => (
                            <Badge
                              key={p}
                              variant="secondary"
                            >
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      {listFields.map((f) => {
                        const isFileSize = /^(file_?size|filesize)$/i.test(f.slug);
                        const val = isFileSize
                          ? item.totalFileSize || null
                          : item.fields?.[f.slug];
                        return (
                          <td
                            key={f.id}
                            className="px-4 py-3 text-sm text-muted-foreground"
                          >
                            {formatFieldValue(val)}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={item.isPublished ? "default" : "secondary"}
                        >
                          {item.isPublished ? "Live" : "Draft"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild title="Edit">
                            <Link href={`/content/${typeSlug}/${item.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          {item.siteCount > 1 ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setUnassignTarget(item)}
                              title="Remove from this site"
                            >
                              <Link2 className="h-4 w-4" style={{ color: "#CC5500" }} />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(item)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      {/* Delete Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}
              &quot;? This will permanently remove the content and its files.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unassign Dialog */}
      <Dialog
        open={!!unassignTarget}
        onOpenChange={(open) => !open && setUnassignTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from This Site</DialogTitle>
            <DialogDescription>
              &quot;{unassignTarget?.title}&quot; is shared across{" "}
              {unassignTarget?.siteCount} sites. Removing it from this site
              won&apos;t delete the content — it will still be available on
              other sites.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUnassignTarget(null)}
              disabled={unassigning}
            >
              Cancel
            </Button>
            <Button onClick={handleUnassign} disabled={unassigning}>
              {unassigning ? "Removing..." : "Remove from My Site"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
