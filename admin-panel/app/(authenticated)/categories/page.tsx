"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { getCache, setCache } from "@/lib/page-cache";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus, Pencil, Trash2, Filter, Tags, Link, ChevronLeft, ChevronRight,
  Swords, Compass, Puzzle, Car, Trophy, Brain, Shield,
  Ghost, Crosshair, Monitor, Joystick, Gamepad2, Flame,
  Heart, Zap, Mountain, Music, Palette, Globe,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

const genreIconMap: Record<string, LucideIcon> = {
  sword: Swords,
  swords: Swords,
  action: Swords,
  adventure: Compass,
  puzzle: Puzzle,
  racing: Car,
  sports: Trophy,
  strategy: Brain,
  rpg: Shield,
  horror: Ghost,
  shooter: Crosshair,
  simulation: Monitor,
  arcade: Joystick,
  fighting: Gamepad2,
  survival: Flame,
  romance: Heart,
  casual: Zap,
  "open-world": Mountain,
  music: Music,
  indie: Palette,
  mmo: Globe,
};

function getGenreIcon(icon: string | null, slug: string): LucideIcon {
  if (icon) {
    const mapped = genreIconMap[icon.toLowerCase()];
    if (mapped) return mapped;
  }
  const slugMapped = genreIconMap[slug.toLowerCase()];
  if (slugMapped) return slugMapped;
  return Tags;
}

interface ContentTypeRef {
  id: string;
  slug: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  contentTypeId: string | null;
  contentType: ContentTypeRef | null;
}

interface SharedCategory extends Category {
  siteNames: string[];
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function CategoriesPage() {
  const _cached = getCache<{ categories: Category[]; contentTypes: ContentTypeRef[] }>("categories");
  const [categories, setCategories] = useState<Category[]>(_cached?.categories ?? []);
  const [contentTypes, setContentTypes] = useState<ContentTypeRef[]>(_cached?.contentTypes ?? []);
  const [loading, setLoading] = useState(!_cached);
  const [error, setError] = useState("");

  // Filter
  const [filterTypeId, setFilterTypeId] = useState<string>("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formIcon, setFormIcon] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formContentTypeId, setFormContentTypeId] = useState("");

  // Remove (unassign) state
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Shared categories view
  const [showShared, setShowShared] = useState(false);
  const [sharedCategories, setSharedCategories] = useState<SharedCategory[]>([]);
  const [sharedPagination, setSharedPagination] = useState<PaginationData | null>(null);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [sharedPage, setSharedPage] = useState(1);
  const [assigning, setAssigning] = useState<string | null>(null);

  // Duplicate linking state
  const [duplicateCategory, setDuplicateCategory] = useState<{ id: string; name: string; slug: string; sites: string[] } | null>(null);
  const [linking, setLinking] = useState(false);

  async function loadData(ctFilter = filterTypeId) {
    try {
      const params = ctFilter ? `?contentTypeId=${ctFilter}` : "";
      const [catRes, ctRes] = await Promise.all([
        api<{ success: boolean; data: Category[] }>(`/admin/categories${params}`),
        api<{ success: boolean; data: ContentTypeRef[] }>("/admin/content-types"),
      ]);
      setCategories(catRes.data);
      setContentTypes(ctRes.data);
      setCache("categories", { categories: catRes.data, contentTypes: ctRes.data });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function loadShared(p = sharedPage) {
    setSharedLoading(true);
    try {
      const res = await api<{
        success: boolean;
        data: SharedCategory[];
        pagination: PaginationData;
      }>(`/admin/categories/shared?page=${p}&limit=20`);
      setSharedCategories(res.data);
      setSharedPagination(res.pagination);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load shared categories");
    } finally {
      setSharedLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    function onVisibilityChange() {
      if (document.visibilityState === "visible") loadData();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (showShared) loadShared(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showShared]);

  function handleFilterChange(typeId: string) {
    setFilterTypeId(typeId);
    loadData(typeId);
  }

  function openCreate() {
    setEditing(null);
    setFormName("");
    setFormSlug("");
    setFormIcon("");
    setFormDescription("");
    setFormContentTypeId(filterTypeId || "");
    setDialogOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormIcon(cat.icon || "");
    setFormDescription(cat.description || "");
    setFormContentTypeId(cat.contentTypeId || "");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!formName.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: formName,
        slug: formSlug || generateSlug(formName),
        icon: formIcon || undefined,
        description: formDescription || undefined,
        contentTypeId: formContentTypeId || undefined,
      };

      if (editing) {
        await api(`/admin/categories/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        toast.success(`"${formName}" updated successfully`);
      } else {
        await api("/admin/categories", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success(`"${formName}" created successfully`);
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      if (err instanceof ApiError && err.data?.code === "DUPLICATE_IN_SHARED_DB") {
        const ec = err.data.existingCategory as any;
        if (ec) {
          setDuplicateCategory(ec);
          setDialogOpen(false);
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error(err instanceof ApiError ? err.message : "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleLinkDuplicate() {
    if (!duplicateCategory) return;
    setLinking(true);
    try {
      await api(`/admin/categories/${duplicateCategory.id}/assign`, { method: "POST" });
      toast.success(`"${duplicateCategory.name}" added to your site`);
      setDuplicateCategory(null);
      loadData();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to link");
    } finally {
      setLinking(false);
    }
  }

  async function handleRemove() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/admin/categories/${deleteTarget.id}`, { method: "DELETE" });
      toast.success(`"${deleteTarget.name}" removed from site`);
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove");
    } finally {
      setDeleting(false);
    }
  }

  async function handleAssign(item: SharedCategory) {
    setAssigning(item.id);
    try {
      await api(`/admin/categories/${item.id}/assign`, { method: "POST" });
      toast.success(`"${item.name}" added to your site`);
      setSharedCategories((prev) => prev.filter((c) => c.id !== item.id));
      if (sharedPagination) {
        setSharedPagination({ ...sharedPagination, total: sharedPagination.total - 1 });
      }
      loadData();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add");
    } finally {
      setAssigning(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
        <Card>
          <CardContent className="p-3 md:p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 md:space-y-6">
        <h1 className="text-xl md:text-2xl font-bold">Genres</h1>
        <Card>
          <CardContent className="p-4 md:p-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Genres</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            {categories.length} {categories.length === 1 ? "genre" : "genres"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showShared ? "default" : "outline"}
            size="sm"
            onClick={() => setShowShared(!showShared)}
            className="md:h-10 md:px-4 md:text-sm"
          >
            <Link className="h-4 w-4" />
            {showShared ? "My Genres" : "Shared Library"}
          </Button>
          {!showShared && (
            <Button onClick={openCreate} size="sm" className="md:h-10 md:px-4 md:text-sm">
              <Plus className="h-4 w-4" />
              Add Genre
            </Button>
          )}
        </div>
      </div>

      {/* Shared Categories View */}
      {showShared ? (
        <>
          <p className="text-sm text-muted-foreground">
            Genres available in the shared database that are not yet on your site. Add them without creating duplicates.
          </p>
          <Card>
            <CardContent className="p-0">
              {sharedLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : sharedCategories.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground">All genres are already on your site.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {sharedCategories.map((item) => {
                    const GenreIcon = getGenreIcon(item.icon, item.slug);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <GenreIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{item.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <code className="text-[10px] text-muted-foreground">{item.slug}</code>
                              {item.contentType && (
                                <Badge variant="secondary">{item.contentType.name}</Badge>
                              )}
                              {item.siteNames.length > 0 && (
                                <span className="text-[10px] text-muted-foreground">
                                  On: {item.siteNames.join(", ")}
                                </span>
                              )}
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
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {sharedPagination && sharedPagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSharedPage(sharedPage - 1); loadShared(sharedPage - 1); }}
                disabled={sharedPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {sharedPage} of {sharedPagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSharedPage(sharedPage + 1); loadShared(sharedPage + 1); }}
                disabled={sharedPage >= sharedPagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Content Type Filter */}
          {contentTypes.length > 0 && (
            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
              <Filter className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
              <button
                onClick={() => handleFilterChange("")}
                className={`rounded-md border px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm transition-colors ${
                  filterTypeId === ""
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted border-input"
                }`}
              >
                All
              </button>
              {contentTypes.map((ct) => (
                <button
                  key={ct.id}
                  onClick={() => handleFilterChange(ct.id)}
                  className={`rounded-md border px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm transition-colors ${
                    filterTypeId === ct.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-input"
                  }`}
                >
                  {ct.name}
                </button>
              ))}
            </div>
          )}

          <Card>
            <CardContent className="p-0">
              {categories.length === 0 ? (
                <div className="p-8 md:p-12 text-center">
                  <p className="text-sm text-muted-foreground">No genres yet.</p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Slug</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Content Type</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((cat) => {
                          const GenreIcon = getGenreIcon(cat.icon, cat.slug);
                          return (
                            <tr key={cat.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <GenreIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  <span className="font-medium text-sm">{cat.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3"><code className="text-xs text-muted-foreground">{cat.slug}</code></td>
                              <td className="px-4 py-3">
                                {cat.contentType ? (
                                  <Badge variant="secondary">{cat.contentType.name}</Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">General</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => openEdit(cat)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(cat)} title="Remove from Site"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile card list */}
                  <div className="md:hidden divide-y">
                    {categories.map((cat) => {
                      const GenreIcon = getGenreIcon(cat.icon, cat.slug);
                      return (
                        <div key={cat.id} className="p-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <GenreIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              <span className="font-medium text-sm block truncate">{cat.name}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <code className="text-[10px] text-muted-foreground">{cat.slug}</code>
                                {cat.contentType && (
                                  <Badge variant="secondary" className="text-[9px] px-1">{cat.contentType.name}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(cat)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">{editing ? "Edit Genre" : "Create Genre"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs md:text-sm">Name</Label>
                <Input
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editing) setFormSlug(generateSlug(e.target.value));
                  }}
                  placeholder="Action"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs md:text-sm">Slug</Label>
                <Input
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="auto-generated"
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs md:text-sm">Icon keyword</Label>
                <Input
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  placeholder="e.g. sword, racing, horror"
                  className="h-9 text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  Keywords: action, adventure, puzzle, racing, sports, strategy, rpg, horror, shooter, simulation, arcade, fighting
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs md:text-sm">Content Type</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formContentTypeId}
                  onChange={(e) => setFormContentTypeId(e.target.value)}
                >
                  <option value="">General (all types)</option>
                  {contentTypes.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional description"
              />
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

      {/* Remove from Site Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Genre from Site</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{deleteTarget?.name}&quot; from this site?
              <span className="block mt-1 text-muted-foreground">
                The genre will still exist in the shared database and can be re-added later.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={deleting}>
              {deleting ? "Removing..." : "Remove from Site"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Found — Offer to Link Dialog */}
      <Dialog open={!!duplicateCategory} onOpenChange={(open) => !open && setDuplicateCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Genre Already Exists</DialogTitle>
            <DialogDescription>
              A genre named &quot;{duplicateCategory?.name}&quot; already exists in the shared database
              {duplicateCategory?.sites && duplicateCategory.sites.length > 0 && (
                <span> (on: {duplicateCategory.sites.join(", ")})</span>
              )}
              . Would you like to add it to your site instead of creating a duplicate?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateCategory(null)} disabled={linking}>
              Cancel
            </Button>
            <Button onClick={handleLinkDuplicate} disabled={linking}>
              {linking ? "Adding..." : "Add to My Site"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
