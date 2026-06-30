"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { getCache, setCache } from "@/lib/page-cache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, ArrowLeft, GripVertical, X } from "lucide-react";
import { toast } from "sonner";

const FIELD_TYPES = [
  "TEXT",
  "TEXTAREA",
  "RICH_TEXT",
  "NUMBER",
  "BOOLEAN",
  "URL",
  "IMAGE",
  "IMAGE_ARRAY",
  "TEXT_ARRAY",
  "SELECT",
  "MULTI_SELECT",
  "RATING",
  "DATE",
] as const;

const FIELD_TYPE_LABELS: Record<string, string> = {
  TEXT: "Text",
  TEXTAREA: "Textarea",
  RICH_TEXT: "Rich Text",
  NUMBER: "Number",
  BOOLEAN: "Boolean",
  URL: "URL",
  IMAGE: "Image",
  IMAGE_ARRAY: "Image Array",
  TEXT_ARRAY: "Text Array",
  SELECT: "Select (Dropdown)",
  MULTI_SELECT: "Multi Select",
  RATING: "Rating",
  DATE: "Date",
};

interface ContentType {
  id: string;
  slug: string;
  name: string;
  contentsCount: number;
}

interface Field {
  id: string;
  contentTypeId: string;
  slug: string;
  name: string;
  fieldType: string;
  isRequired: boolean;
  defaultValue: unknown;
  options: string[] | null;
  placeholder: string | null;
  helpText: string | null;
  sortOrder: number;
  group: string;
  showInList: boolean;
  showInDetail: boolean;
  isFilterable: boolean;
  isSortable: boolean;
  validation: Record<string, unknown> | null;
}

interface FieldForm {
  name: string;
  slug: string;
  fieldType: string;
  isRequired: boolean;
  placeholder: string;
  helpText: string;
  group: string;
  showInList: boolean;
  showInDetail: boolean;
  isFilterable: boolean;
  isSortable: boolean;
  options: string[];
  validationMin: string;
  validationMax: string;
}

const emptyFieldForm: FieldForm = {
  name: "",
  slug: "",
  fieldType: "TEXT",
  isRequired: false,
  placeholder: "",
  helpText: "",
  group: "general",
  showInList: false,
  showInDetail: true,
  isFilterable: false,
  isSortable: false,
  options: [],
  validationMin: "",
  validationMax: "",
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export default function FieldsPage() {
  const params = useParams();
  const router = useRouter();
  const contentTypeId = params.id as string;

  const _cached = getCache<{ contentType: ContentType; fields: Field[] }>(`fields-${contentTypeId}`);
  const [contentType, setContentType] = useState<ContentType | null>(_cached?.contentType ?? null);
  const [fields, setFields] = useState<Field[]>(_cached?.fields ?? []);
  const [loading, setLoading] = useState(!_cached);
  const [error, setError] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Field | null>(null);
  const [form, setForm] = useState<FieldForm>(emptyFieldForm);
  const [saving, setSaving] = useState(false);
  const [newOption, setNewOption] = useState("");

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Field | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Group field: track whether user is creating a new group
  const [creatingNewGroup, setCreatingNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // Drag reorder state
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  async function loadData() {
    try {
      const [typeRes, fieldsRes] = await Promise.all([
        api<{ success: boolean; data: ContentType }>(
          `/admin/content-types/${contentTypeId}`,
        ),
        api<{ success: boolean; data: Field[] }>(
          `/admin/content-types/${contentTypeId}/fields`,
        ),
      ]);
      setContentType(typeRes.data);
      setFields(fieldsRes.data);
      setCache(`fields-${contentTypeId}`, { contentType: typeRes.data, fields: fieldsRes.data });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentTypeId]);

  function openCreate() {
    setEditing(null);
    setForm(emptyFieldForm);
    setCreatingNewGroup(false);
    setNewGroupName("");
    setDialogOpen(true);
  }

  function openEdit(field: Field) {
    setEditing(field);
    setCreatingNewGroup(false);
    setNewGroupName("");
    const validation = (field.validation || {}) as Record<string, unknown>;
    setForm({
      name: field.name,
      slug: field.slug,
      fieldType: field.fieldType,
      isRequired: field.isRequired,
      placeholder: field.placeholder || "",
      helpText: field.helpText || "",
      group: field.group,
      showInList: field.showInList,
      showInDetail: field.showInDetail,
      isFilterable: field.isFilterable,
      isSortable: field.isSortable,
      options: Array.isArray(field.options) ? field.options : [],
      validationMin: validation.min !== undefined ? String(validation.min) : "",
      validationMax: validation.max !== undefined ? String(validation.max) : "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.fieldType) {
      toast.error("Field type is required");
      return;
    }

    setSaving(true);
    try {
      const hasOptions = ["SELECT", "MULTI_SELECT"].includes(form.fieldType);
      const hasMinMax = ["NUMBER", "RATING"].includes(form.fieldType);

      const validation: Record<string, unknown> = {};
      if (hasMinMax) {
        if (form.validationMin !== "")
          validation.min = Number(form.validationMin);
        if (form.validationMax !== "")
          validation.max = Number(form.validationMax);
      }

      const payload: Record<string, unknown> = {
        name: form.name,
        slug: form.slug || generateSlug(form.name),
        fieldType: form.fieldType,
        isRequired: form.isRequired,
        placeholder: form.placeholder || undefined,
        helpText: form.helpText || undefined,
        group: form.group || "general",
        showInList: form.showInList,
        showInDetail: form.showInDetail,
        isFilterable: form.isFilterable,
        isSortable: form.isSortable,
        options: hasOptions ? form.options : undefined,
        validation: Object.keys(validation).length > 0 ? validation : undefined,
      };

      if (!editing) {
        payload.sortOrder = fields.length;
      }

      if (editing) {
        await api(
          `/admin/content-types/${contentTypeId}/fields/${editing.id}`,
          { method: "PUT", body: JSON.stringify(payload) },
        );
        toast.success("Field updated");
      } else {
        await api(`/admin/content-types/${contentTypeId}/fields`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Field created");
      }

      setDialogOpen(false);
      await loadData();
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
      await api(
        `/admin/content-types/${contentTypeId}/fields/${deleteTarget.id}`,
        { method: "DELETE" },
      );
      toast.success("Field deleted");
      setFields((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  function addOption() {
    const val = newOption.trim();
    if (!val) return;
    if (form.options.includes(val)) {
      toast.error("Option already exists");
      return;
    }
    setForm((prev) => ({ ...prev, options: [...prev.options, val] }));
    setNewOption("");
  }

  function removeOption(index: number) {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  }

  // Drag-and-drop reorder
  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  async function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }

    const reordered = [...fields];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setFields(reordered);
    setDragIndex(null);

    try {
      await api(`/admin/content-types/${contentTypeId}/fields-order`, {
        method: "PUT",
        body: JSON.stringify({ fieldIds: reordered.map((f) => f.id) }),
      });
      toast.success("Fields reordered");
    } catch {
      toast.error("Failed to reorder");
      await loadData();
    }
  }

  // Group fields by group name
  const grouped = fields.reduce<Record<string, Field[]>>((acc, field) => {
    const g = field.group || "general";
    if (!acc[g]) acc[g] = [];
    acc[g].push(field);
    return acc;
  }, {});

  // Available groups for the dropdown (derived from existing fields)
  const availableGroups = Array.from(
    new Set(fields.map((f) => f.group || "general"))
  ).sort();

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="p-6 space-y-4">
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
        <h1 className="text-lg md:text-2xl font-bold">Fields</h1>
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
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/content-types")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg md:text-2xl font-bold">
              {contentType?.name} — Fields
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {fields.length} fields defined
              {contentType && contentType.contentsCount > 0 && (
                <span>
                  {" "}
                  &middot; {contentType.contentsCount} content items use this
                  type
                </span>
              )}
            </p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Field
        </Button>
      </div>

      {fields.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              No fields defined yet. Add fields to define the structure of your{" "}
              {contentType?.name || "content"} items.
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([group, groupFields]) => (
          <Card key={group}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {group}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="w-8 px-2 py-2" />
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                        Slug
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                        Type
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">
                        Required
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">
                        List
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">
                        Filter
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupFields.map((field) => {
                      const globalIndex = fields.findIndex(
                        (f) => f.id === field.id,
                      );
                      return (
                        <tr
                          key={field.id}
                          className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                          draggable
                          onDragStart={() => handleDragStart(globalIndex)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDrop(globalIndex)}
                        >
                          <td className="px-2 py-2 cursor-grab">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </td>
                          <td className="px-4 py-2 font-medium text-sm">
                            {field.name}
                          </td>
                          <td className="px-4 py-2">
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {field.slug}
                            </code>
                          </td>
                          <td className="px-4 py-2">
                            <Badge variant="outline">
                              {FIELD_TYPE_LABELS[field.fieldType] ||
                                field.fieldType}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-center text-sm">
                            {field.isRequired ? (
                              <span className="text-primary">Yes</span>
                            ) : (
                              <span className="text-muted-foreground">No</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center text-sm">
                            {field.showInList ? (
                              <span className="text-primary">Yes</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center text-sm">
                            {field.isFilterable ? (
                              <span className="text-primary">Yes</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(field)}
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteTarget(field)}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Create/Edit Field Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Field" : "Add Field"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the field configuration."
                : "Define a new dynamic field for this content type."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name & Slug */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <Label htmlFor="fieldName">Name</Label>
                <Input
                  id="fieldName"
                  placeholder="e.g. Genre, Rating, Developer"
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
                <Label htmlFor="fieldSlug">Slug</Label>
                <Input
                  id="fieldSlug"
                  placeholder="auto_generated"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, slug: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Type & Group */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <Label>Field Type</Label>
                <Select
                  value={form.fieldType}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, fieldType: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {FIELD_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="fieldGroup">Group</Label>
                {creatingNewGroup ? (
                  <div className="flex gap-2">
                    <Input
                      id="fieldGroup"
                      placeholder="New group name"
                      value={newGroupName}
                      autoFocus
                      onChange={(e) => {
                        setNewGroupName(e.target.value);
                        setForm((prev) => ({ ...prev, group: e.target.value }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setCreatingNewGroup(false);
                          setForm((prev) => ({ ...prev, group: availableGroups[0] || "general" }));
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      title="Cancel"
                      onClick={() => {
                        setCreatingNewGroup(false);
                        setForm((prev) => ({ ...prev, group: availableGroups[0] || "general" }));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={form.group}
                    onValueChange={(val) => {
                      if (val === "__new__") {
                        setCreatingNewGroup(true);
                        setNewGroupName("");
                        setForm((prev) => ({ ...prev, group: "" }));
                      } else {
                        setForm((prev) => ({ ...prev, group: val }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGroups.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g.charAt(0).toUpperCase() + g.slice(1)}
                        </SelectItem>
                      ))}
                      {availableGroups.length === 0 && (
                        <SelectItem value="general">General</SelectItem>
                      )}
                      <SelectItem value="__new__">
                        + Create New Group
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Placeholder & Help Text */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <Label htmlFor="fieldPlaceholder">Placeholder</Label>
                <Input
                  id="fieldPlaceholder"
                  placeholder="Optional placeholder text"
                  value={form.placeholder}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      placeholder: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="fieldHelp">Help Text</Label>
                <Input
                  id="fieldHelp"
                  placeholder="Optional help text"
                  value={form.helpText}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, helpText: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Options editor for SELECT / MULTI_SELECT */}
            {["SELECT", "MULTI_SELECT"].includes(form.fieldType) && (
              <div className="space-y-2.5">
                <Label>Options</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add an option"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addOption();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addOption}
                    size="sm"
                    className="shrink-0"
                  >
                    Add
                  </Button>
                </div>
                {form.options.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.options.map((opt, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {opt}
                        <button
                          type="button"
                          onClick={() => removeOption(i)}
                          className="ml-1 rounded-full hover:bg-muted p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Min/Max for NUMBER / RATING */}
            {["NUMBER", "RATING"].includes(form.fieldType) && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <Label htmlFor="validMin">Min Value</Label>
                  <Input
                    id="validMin"
                    type="number"
                    min={0}
                    placeholder="No min"
                    value={form.validationMin}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        validationMin: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="validMax">Max Value</Label>
                  <Input
                    id="validMax"
                    type="number"
                    min={0}
                    placeholder={
                      form.fieldType === "RATING" ? "5" : "No max"
                    }
                    value={form.validationMax}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        validationMax: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            )}

            {/* Toggle switches */}
            <div className="border rounded-md p-4 space-y-3">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Field Options
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3">
                  <Switch
                    id="isRequired"
                    checked={form.isRequired}
                    onCheckedChange={(c) =>
                      setForm((prev) => ({ ...prev, isRequired: c }))
                    }
                  />
                  <Label htmlFor="isRequired" className="text-sm">
                    Required
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="showInList"
                    checked={form.showInList}
                    onCheckedChange={(c) =>
                      setForm((prev) => ({ ...prev, showInList: c }))
                    }
                  />
                  <Label htmlFor="showInList" className="text-sm">
                    Show in List
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="showInDetail"
                    checked={form.showInDetail}
                    onCheckedChange={(c) =>
                      setForm((prev) => ({ ...prev, showInDetail: c }))
                    }
                  />
                  <Label htmlFor="showInDetail" className="text-sm">
                    Show in Detail
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="isFilterable"
                    checked={form.isFilterable}
                    onCheckedChange={(c) =>
                      setForm((prev) => ({ ...prev, isFilterable: c }))
                    }
                  />
                  <Label htmlFor="isFilterable" className="text-sm">
                    Filterable
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="isSortable"
                    checked={form.isSortable}
                    onCheckedChange={(c) =>
                      setForm((prev) => ({ ...prev, isSortable: c }))
                    }
                  />
                  <Label htmlFor="isSortable" className="text-sm">
                    Sortable
                  </Label>
                </div>
              </div>
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
            <DialogTitle>Delete Field</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the field &quot;
              {deleteTarget?.name}&quot;? Existing content will keep the data
              but it won&apos;t be editable or visible.
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
    </div>
  );
}
