"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { Plus, Pencil, Trash2, Settings2 } from "lucide-react";
import { toast } from "sonner";

interface ContentType {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  fieldsCount: number;
  contentsCount: number;
}

interface FormData {
  name: string;
  slug: string;
  icon: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

const emptyForm: FormData = {
  name: "",
  slug: "",
  icon: "",
  description: "",
  isActive: true,
  sortOrder: 0,
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ContentTypesPage() {
  const _cached = getCache<{ types: ContentType[] }>("content-types");
  const [types, setTypes] = useState<ContentType[]>(_cached?.types ?? []);
  const [loading, setLoading] = useState(!_cached);
  const [error, setError] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContentType | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<ContentType | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadTypes() {
    try {
      const res = await api<{ success: boolean; data: ContentType[] }>(
        "/admin/content-types",
      );
      setTypes(res.data);
      setCache("content-types", { types: res.data });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTypes();
    function onVisibilityChange() {
      if (document.visibilityState === "visible") loadTypes();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(type: ContentType) {
    setEditing(type);
    setForm({
      name: type.name,
      slug: type.slug,
      icon: type.icon || "",
      description: type.description || "",
      isActive: type.isActive,
      sortOrder: type.sortOrder,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: form.slug || generateSlug(form.name),
        icon: form.icon || undefined,
        description: form.description || undefined,
      };

      if (editing) {
        await api(`/admin/content-types/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Content type updated");
      } else {
        await api("/admin/content-types", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Content type created");
      }

      setDialogOpen(false);
      await loadTypes();
      window.dispatchEvent(new Event("content-types-changed"));
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to save",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/admin/content-types/${deleteTarget.id}`, {
        method: "DELETE",
      });
      toast.success("Content type deleted");
      setTypes((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
      window.dispatchEvent(new Event("content-types-changed"));
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to delete",
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg md:text-2xl font-bold">Content Types</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="space-y-4 p-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 md:space-y-6">
        <h1 className="text-lg md:text-2xl font-bold">Content Types</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-2xl font-bold">Content Types</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">
            Define the types of content your site can manage
          </p>
        </div>
        <Button onClick={openCreate} size="sm" className="md:h-10 md:px-4 md:text-sm">
          <Plus className="h-4 w-4" />
          Add Type
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {types.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">
                No content types yet. Create one to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Slug
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      Fields
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      Content
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      Status
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
                  {types.map((type) => (
                    <tr
                      key={type.id}
                      className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {type.icon && (
                            <span className="text-lg">{type.icon}</span>
                          )}
                          <span className="font-medium">{type.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {type.slug}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/content-types/${type.id}/fields`}
                          className="text-primary hover:underline font-mono text-sm"
                        >
                          {type.fieldsCount}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-sm">
                        {type.contentsCount}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={type.isActive ? "default" : "secondary"}
                        >
                          {type.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-sm text-muted-foreground">
                        {type.sortOrder}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            title="Manage Fields"
                          >
                            <Link
                              href={`/content-types/${type.id}/fields`}
                            >
                              <Settings2 className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(type)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(type)}
                            title="Delete"
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Content Type" : "Create Content Type"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the content type details."
                : "Define a new type of content for your site."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g. Games, Software, Plugins"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    name,
                    slug: editing ? prev.slug : generateSlug(name),
                  }));
                }}
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="auto-generated-from-name"
                value={form.slug}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, slug: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <Label htmlFor="icon">Icon (emoji)</Label>
                <EmojiPicker
                  id="icon"
                  value={form.icon}
                  onChange={(val) =>
                    setForm((prev) => ({ ...prev, icon: val }))
                  }
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      sortOrder: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Optional description"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, isActive: checked }))
                }
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && deleteTarget.contentsCount > 0 && (
            <p className="text-sm text-destructive">
              This type has {deleteTarget.contentsCount} content items. You
              must delete or reassign them first.
            </p>
          )}
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
    </div>
  );
}
