"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { getCache, setCache } from "@/lib/page-cache";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import { ImageUpload } from "@/components/ui/image-upload";

const RichTextEditor = dynamic(
  () => import("@/components/ui/rich-text-editor").then((mod) => mod.RichTextEditor),
  { ssr: false, loading: () => <div className="h-[200px] bg-muted/50 rounded-md animate-pulse" /> }
);
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Article {
  id: string;
  slug: string;
  title: string;
  body: string;
  category: string;
  date: string | null;
  author: string | null;
  excerpt: string | null;
  image: string | null;
  isPublished: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ArticlesPage() {
  const _cached = getCache<{ articles: Article[]; pagination: PaginationData }>("articles");
  const [articles, setArticles] = useState<Article[]>(_cached?.articles ?? []);
  const [pagination, setPagination] = useState<PaginationData | null>(_cached?.pagination ?? null);
  const [loading, setLoading] = useState(!_cached);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formAuthor, setFormAuthor] = useState("");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formPublished, setFormPublished] = useState(true);
  const [formMetaTitle, setFormMetaTitle] = useState("");
  const [formMetaDesc, setFormMetaDesc] = useState("");

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [deleting, setDeleting] = useState(false);

  const articleTypes = ["Guide", "Update", "Editorial"];

  async function loadData(p = page) {
    try {
      const res = await api<{
        success: boolean;
        data: Article[];
        pagination: PaginationData;
      }>(`/admin/articles?page=${p}&limit=20`);
      setArticles(res.data);
      setPagination(res.pagination);
      setCache("articles", { articles: res.data, pagination: res.pagination });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(1);
    function onVisibilityChange() {
      if (document.visibilityState === "visible") loadData();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goToPage(p: number) {
    setPage(p);
    loadData(p);
  }

  function openCreate() {
    setEditing(null);
    setFormTitle("");
    setFormSlug("");
    setFormBody("");
    setFormCategory("Guide");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormAuthor("");
    setFormExcerpt("");
    setFormImage("");
    setFormPublished(true);
    setFormMetaTitle("");
    setFormMetaDesc("");
    setDialogOpen(true);
  }

  function openEdit(article: Article) {
    setEditing(article);
    setFormTitle(article.title);
    setFormSlug(article.slug);
    setFormBody(article.body);
    setFormCategory(article.category);
    setFormDate(article.date || "");
    setFormAuthor(article.author || "");
    setFormExcerpt(article.excerpt || "");
    setFormImage(article.image || "");
    setFormPublished(article.isPublished);
    setFormMetaTitle(article.metaTitle || "");
    setFormMetaDesc(article.metaDescription || "");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formTitle.trim() || !formBody.trim()) {
      toast.error("Title and body are required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: formTitle,
        slug: formSlug || generateSlug(formTitle),
        body: formBody,
        category: formCategory || "Guide",
        date: formDate || undefined,
        author: formAuthor || undefined,
        excerpt: formExcerpt || undefined,
        image: formImage || undefined,
        isPublished: formPublished,
        metaTitle: formMetaTitle || undefined,
        metaDescription: formMetaDesc || undefined,
      };

      if (editing) {
        await api(`/admin/articles/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        toast.success(`"${formTitle}" updated successfully`);
      } else {
        await api("/admin/articles", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success(`"${formTitle}" created successfully`);
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/admin/articles/${deleteTarget.id}`, { method: "DELETE" });
      toast.success(`"${deleteTarget.title}" deleted successfully`);
      setArticles((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      if (pagination) setPagination((p) => p ? { ...p, total: p.total - 1 } : null);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
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
        <h1 className="text-lg md:text-2xl font-bold">Articles</h1>
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-lg md:text-2xl font-bold">Articles</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
            {pagination?.total || 0} articles
          </p>
        </div>
        <Button onClick={openCreate} size="sm" className="md:h-10 md:px-4 md:text-sm">
          <Plus className="h-4 w-4" />
          New Article
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {articles.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No articles yet.</p>
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
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Author
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article) => (
                    <tr
                      key={article.id}
                      className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate max-w-[250px]">
                            {article.title}
                          </p>
                          <code className="text-[10px] text-muted-foreground">
                            {article.slug}
                          </code>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">
                          {article.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {article.author || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={article.isPublished ? "default" : "secondary"}
                        >
                          {article.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {article.date || formatDate(article.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(article)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(article)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
          <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={page <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pagination.totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)} disabled={page >= pagination.totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Article" : "New Article"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <Label>Title <span className="text-destructive">*</span></Label>
                <Input
                  value={formTitle}
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                    if (!editing) setFormSlug(generateSlug(e.target.value));
                  }}
                  placeholder="Article title"
                />
              </div>
              <div className="space-y-2.5">
                <Label>Slug</Label>
                <Input
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="auto-generated"
                />
              </div>
            </div>
            <div className="space-y-2.5">
              <Label>Body <span className="text-destructive">*</span></Label>
              <RichTextEditor
                value={formBody}
                onChange={setFormBody}
                placeholder="Start writing your article..."
              />
            </div>
            <div className="space-y-2.5">
              <Label>Excerpt</Label>
              <Input
                value={formExcerpt}
                onChange={(e) => setFormExcerpt(e.target.value)}
                placeholder="Short summary"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2.5">
                <Label>Type</Label>
                <Select
                  value={formCategory}
                  onValueChange={setFormCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {articleTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2.5">
                <Label>Author</Label>
                <Input
                  value={formAuthor}
                  onChange={(e) => setFormAuthor(e.target.value)}
                  placeholder="Author name"
                />
              </div>
              <div className="space-y-2.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2.5">
              <Label>Cover Image</Label>
              <ImageUpload
                value={formImage}
                onChange={setFormImage}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formPublished} onCheckedChange={setFormPublished} />
              <Label>Published</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <Label>Meta Title</Label>
                <Input
                  value={formMetaTitle}
                  onChange={(e) => setFormMetaTitle(e.target.value)}
                  placeholder="SEO title"
                />
              </div>
              <div className="space-y-2.5">
                <Label>Meta Description</Label>
                <Input
                  value={formMetaDesc}
                  onChange={(e) => setFormMetaDesc(e.target.value)}
                  placeholder="SEO description"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
