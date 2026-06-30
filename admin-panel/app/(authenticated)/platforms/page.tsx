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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Filter, Search, ChevronLeft, ChevronRight, Link } from "lucide-react";
import { toast } from "sonner";

interface ContentTypeRef {
  id: string;
  slug: string;
  name: string;
}

interface Platform {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  classic: boolean;
  sortOrder: number;
  count: number;
  contentTypes: ContentTypeRef[];
}

interface SharedPlatform extends Platform {
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

export default function PlatformsPage() {
  const _cached = getCache<{ platforms: Platform[]; contentTypes: ContentTypeRef[] }>("platforms");
  const [platforms, setPlatforms] = useState<Platform[]>(_cached?.platforms ?? []);
  const [contentTypes, setContentTypes] = useState<ContentTypeRef[]>(_cached?.contentTypes ?? []);
  const [loading, setLoading] = useState(!_cached);
  const [error, setError] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Platform | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formIcon, setFormIcon] = useState("");
  const [formColor, setFormColor] = useState("#468284");
  const [formClassic, setFormClassic] = useState(false);
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formContentTypeIds, setFormContentTypeIds] = useState<string[]>([]);

  // Filter
  const [filterTypeId, setFilterTypeId] = useState("");

  // Remove (unassign) state
  const [deleteTarget, setDeleteTarget] = useState<Platform | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Shared platforms view
  const [showShared, setShowShared] = useState(false);
  const [sharedPlatforms, setSharedPlatforms] = useState<SharedPlatform[]>([]);
  const [sharedPagination, setSharedPagination] = useState<PaginationData | null>(null);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [sharedPage, setSharedPage] = useState(1);
  const [assigning, setAssigning] = useState<string | null>(null);

  // Duplicate linking state
  const [duplicatePlatform, setDuplicatePlatform] = useState<{ id: string; name: string; slug: string; sites: string[] } | null>(null);
  const [linking, setLinking] = useState(false);

  async function loadData() {
    try {
      const [platformsRes, ctRes] = await Promise.all([
        api<{ success: boolean; data: Platform[] }>("/admin/platforms"),
        api<{ success: boolean; data: ContentTypeRef[] }>("/admin/content-types"),
      ]);
      setPlatforms(platformsRes.data);
      setContentTypes(ctRes.data);
      setCache("platforms", { platforms: platformsRes.data, contentTypes: ctRes.data });
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
        data: SharedPlatform[];
        pagination: PaginationData;
      }>(`/admin/platforms/shared?page=${p}&limit=20`);
      setSharedPlatforms(res.data);
      setSharedPagination(res.pagination);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load shared platforms");
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
  }, []);

  useEffect(() => {
    if (showShared) loadShared(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showShared]);

  function openCreate() {
    setEditing(null);
    setFormName("");
    setFormSlug("");
    setFormIcon("");
    setFormColor("#468284");
    setFormClassic(false);
    setFormSortOrder(platforms.length);
    setFormContentTypeIds([]);
    setDialogOpen(true);
  }

  function openEdit(p: Platform) {
    setEditing(p);
    setFormName(p.name);
    setFormSlug(p.slug);
    setFormIcon(p.icon || "");
    setFormColor(p.color || "#468284");
    setFormClassic(p.classic);
    setFormSortOrder(p.sortOrder);
    setFormContentTypeIds(p.contentTypes.map((ct) => ct.id));
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
        color: formColor || undefined,
        classic: formClassic,
        sortOrder: formSortOrder,
        contentTypeIds: formContentTypeIds,
      };

      if (editing) {
        await api(`/admin/platforms/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        toast.success(`"${formName}" updated successfully`);
      } else {
        await api("/admin/platforms", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success(`"${formName}" created successfully`);
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      if (err instanceof ApiError && err.data?.code === "DUPLICATE_IN_SHARED_DB") {
        // Platform exists in shared DB — offer to link
        const ep = err.data.existingPlatform as any;
        if (ep) {
          setDuplicatePlatform(ep);
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
    if (!duplicatePlatform) return;
    setLinking(true);
    try {
      await api(`/admin/platforms/${duplicatePlatform.id}/assign`, { method: "POST" });
      toast.success(`"${duplicatePlatform.name}" added to your site`);
      setDuplicatePlatform(null);
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
      await api(`/admin/platforms/${deleteTarget.id}`, { method: "DELETE" });
      toast.success(`"${deleteTarget.name}" removed from site`);
      setPlatforms((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove");
    } finally {
      setDeleting(false);
    }
  }

  async function handleAssign(item: SharedPlatform) {
    setAssigning(item.id);
    try {
      await api(`/admin/platforms/${item.id}/assign`, { method: "POST" });
      toast.success(`"${item.name}" added to your site`);
      setSharedPlatforms((prev) => prev.filter((p) => p.id !== item.id));
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

  function toggleContentType(ctId: string) {
    setFormContentTypeIds((prev) =>
      prev.includes(ctId) ? prev.filter((id) => id !== ctId) : [...prev, ctId],
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
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
        <h1 className="text-lg md:text-2xl font-bold">Platforms</h1>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-2xl font-bold">Platforms</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
            {platforms.length} platforms
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
            {showShared ? "My Platforms" : "Shared Library"}
          </Button>
          {!showShared && (
            <Button onClick={openCreate} size="sm" className="md:h-10 md:px-4 md:text-sm">
              <Plus className="h-4 w-4" />
              Add Platform
            </Button>
          )}
        </div>
      </div>

      {/* Shared Platforms View */}
      {showShared ? (
        <>
          <p className="text-sm text-muted-foreground">
            Platforms available in the shared database that are not yet on your site. Add them without creating duplicates.
          </p>
          <Card>
            <CardContent className="p-0">
              {sharedLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : sharedPlatforms.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground">All platforms are already on your site.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {sharedPlatforms.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.color && (
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <code className="text-[10px] text-muted-foreground">{item.slug}</code>
                            {item.contentTypes.map((ct) => (
                              <Badge key={ct.id} variant="secondary">{ct.name}</Badge>
                            ))}
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
                  ))}
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
                onClick={() => setFilterTypeId("")}
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
                  onClick={() => setFilterTypeId(ct.id)}
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
              {platforms.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground">No platforms yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          Platform
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          Slug
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          Content Types
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                          Content
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                          Classic
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                          Order
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(filterTypeId
                        ? platforms.filter((p) =>
                            p.contentTypes.some((ct) => ct.id === filterTypeId),
                          )
                        : platforms
                      ).map((p) => (
                        <tr
                          key={p.id}
                          className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {p.color && (
                                <span
                                  className="w-3 h-3 rounded-full shrink-0"
                                  style={{ backgroundColor: p.color }}
                                />
                              )}
                              <span className="font-medium text-sm">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <code className="text-xs text-muted-foreground">{p.slug}</code>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {p.contentTypes.length > 0
                                ? p.contentTypes.map((ct) => (
                                    <Badge key={ct.id} variant="secondary">
                                      {ct.name}
                                    </Badge>
                                  ))
                                : <span className="text-xs text-muted-foreground">All</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                            {p.count}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {p.classic && (
                              <Badge variant="outline">Classic</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                            {p.sortOrder}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(p)} title="Edit">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteTarget(p)}
                                title="Remove from Site"
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
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Platform" : "Create Platform"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editing) setFormSlug(generateSlug(e.target.value));
                  }}
                  placeholder="PlayStation 5"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="auto-generated"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <Input
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  placeholder="e.g. gamepad"
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-12 p-1 h-10"
                  />
                  <Input
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  min={0}
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={formClassic} onCheckedChange={setFormClassic} />
              <Label>Classic / Retro platform</Label>
            </div>

            {contentTypes.length > 0 && (
              <div className="space-y-2">
                <Label>Content Types</Label>
                <p className="text-xs text-muted-foreground">
                  Which content types are available on this platform? Leave empty for all.
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {contentTypes.map((ct) => {
                    const selected = formContentTypeIds.includes(ct.id);
                    return (
                      <button
                        key={ct.id}
                        type="button"
                        onClick={() => toggleContentType(ct.id)}
                        className={`inline-flex items-center rounded-md border px-3 py-1.5 text-sm transition-colors ${
                          selected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted border-input"
                        }`}
                      >
                        {ct.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
            <DialogTitle>Remove Platform from Site</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{deleteTarget?.name}&quot; from this site?
              {deleteTarget && deleteTarget.count > 0 && (
                <span className="block mt-1" style={{ color: "#CC5500" }}>
                  This platform has {deleteTarget.count} content items associated with it.
                </span>
              )}
              <span className="block mt-1 text-muted-foreground">
                The platform will still exist in the shared database and can be re-added later.
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
      <Dialog open={!!duplicatePlatform} onOpenChange={(open) => !open && setDuplicatePlatform(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Platform Already Exists</DialogTitle>
            <DialogDescription>
              A platform named &quot;{duplicatePlatform?.name}&quot; already exists in the shared database
              {duplicatePlatform?.sites && duplicatePlatform.sites.length > 0 && (
                <span> (on: {duplicatePlatform.sites.join(", ")})</span>
              )}
              . Would you like to add it to your site instead of creating a duplicate?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicatePlatform(null)} disabled={linking}>
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
