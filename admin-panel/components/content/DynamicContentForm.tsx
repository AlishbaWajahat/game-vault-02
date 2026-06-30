"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiError } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DynamicFieldRenderer,
  type FieldDefinition,
} from "@/components/content/DynamicFieldRenderer";
import { ImageUpload } from "@/components/ui/image-upload";
import { X, Info } from "lucide-react";
import { toast } from "sonner";

interface Platform {
  id: string;
  name: string;
  slug: string;
}

interface SharedMatch {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  platform: string[];
  siteNames: string[];
}

interface DynamicContentFormProps {
  contentTypeId: string;
  contentTypeName: string;
  fieldDefinitions: FieldDefinition[];
  initialData?: {
    id: string;
    title: string;
    slug: string;
    coverImage: string;
    description: string;
    isPublished: boolean;
    metaTitle: string;
    metaDescription: string;
    platformIds: string[];
    fields: Record<string, unknown>;
  };
  onSave: (data: Record<string, unknown>) => Promise<void>;
  saving: boolean;
  hideSubmit?: boolean;
  formId?: string;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function DynamicContentForm({
  contentTypeId,
  contentTypeName,
  fieldDefinitions,
  initialData,
  onSave,
  saving,
  hideSubmit,
  formId,
}: DynamicContentFormProps) {
  const isEdit = !!initialData;

  // Static fields
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [isPublished, setIsPublished] = useState(initialData?.isPublished ?? true);
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || "");

  // Platform multi-select
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<string[]>(
    initialData?.platformIds || [],
  );

  // Dynamic fields
  const [fields, setFields] = useState<Record<string, unknown>>(
    initialData?.fields || {},
  );

  // Fuzzy duplicate detection — search both current site + shared DB
  const [siteMatches, setSiteMatches] = useState<SharedMatch[]>([]);
  const [sharedMatches, setSharedMatches] = useState<SharedMatch[]>([]);
  const [searchingDupes, setSearchingDupes] = useState(false);

  // Load platforms
  useEffect(() => {
    api<{ success: boolean; data: Platform[] }>("/admin/platforms")
      .then((res) => setPlatforms(res.data))
      .catch(() => {});
  }, []);

  // Debounced title search for duplicate detection (create only)
  const searchDuplicates = useCallback(
    async (searchTitle: string) => {
      if (!searchTitle || searchTitle.length < 3 || isEdit) {
        setSiteMatches([]);
        setSharedMatches([]);
        return;
      }
      setSearchingDupes(true);
      try {
        const encoded = encodeURIComponent(searchTitle);
        const [siteRes, sharedRes] = await Promise.all([
          api<{ success: boolean; data: SharedMatch[] }>(
            `/admin/content?search=${encoded}&limit=5`,
          ),
          api<{ success: boolean; data: SharedMatch[] }>(
            `/admin/content/shared?search=${encoded}&limit=5`,
          ),
        ]);
        setSiteMatches(siteRes.data);
        setSharedMatches(sharedRes.data);
      } catch {
        setSiteMatches([]);
        setSharedMatches([]);
      } finally {
        setSearchingDupes(false);
      }
    },
    [isEdit],
  );

  useEffect(() => {
    if (isEdit) return;
    const timer = setTimeout(() => {
      searchDuplicates(title);
    }, 500);
    return () => clearTimeout(timer);
  }, [title, searchDuplicates, isEdit]);

  function updateField(slug: string, value: unknown) {
    setFields((prev) => ({ ...prev, [slug]: value }));
  }

  function togglePlatform(platformId: string) {
    setSelectedPlatformIds((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId],
    );
  }

  async function handleAssign(contentId: string) {
    try {
      await api(`/admin/content/${contentId}/assign`, { method: "POST" });
      toast.success("Content added to your site");
      // Remove from matches
      setSharedMatches((prev) => prev.filter((m) => m.id !== contentId));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to assign");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    const data: Record<string, unknown> = {
      contentTypeId,
      title,
      slug: slug || generateSlug(title),
      coverImage: coverImage || undefined,
      description: description || undefined,
      isPublished,
      metaTitle: metaTitle || undefined,
      metaDescription: metaDescription || undefined,
      platformIds: selectedPlatformIds,
      fields,
    };

    onSave(data);
  }

  // Filter out file_size fields (auto-detected from uploads)
  const filteredDefinitions = fieldDefinitions.filter(
    (f) => !/^(file_?size|filesize)$/i.test(f.slug),
  );

  // Group fields by group
  const grouped = filteredDefinitions.reduce<Record<string, FieldDefinition[]>>(
    (acc, field) => {
      const g = field.group || "general";
      if (!acc[g]) acc[g] = [];
      acc[g].push(field);
      return acc;
    },
    {},
  );

  return (
    <form onSubmit={handleSubmit} id={formId} className="space-y-4 md:space-y-6">
      {/* Fuzzy duplicate detection panel — current site matches */}
      {!isEdit && siteMatches.length > 0 && (
        <Card className="bg-orange-50 dark:bg-orange-950/30" style={{ borderColor: "#CC5500" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm flex items-center gap-2 dark:text-orange-300" style={{ color: "#CC5500" }}>
              <Info className="h-4 w-4 shrink-0" />
              Similar content already on your site
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {siteMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between bg-background rounded-md px-3 py-2 border"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {match.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {match.platform?.join(", ") || "No platforms"}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    Already on site
                  </Badge>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Content with a similar name already exists on your site. Make
              sure you&apos;re not creating a duplicate.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Fuzzy duplicate detection panel — shared DB matches */}
      {!isEdit && sharedMatches.length > 0 && (
        <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Info className="h-4 w-4 shrink-0" />
              Similar content found in shared database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sharedMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between bg-background rounded-md px-3 py-2 border"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {match.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {match.platform?.join(", ") || "No platforms"}{" "}
                      &middot; On: {match.siteNames?.join(", ") || "other sites"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => handleAssign(match.id)}
                  >
                    Add to My Site
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Add existing content to your site instead of creating a
              duplicate, or continue creating below.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm md:text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder={`${contentTypeName} title`}
                value={title}
                onChange={(e) => {
                  const t = e.target.value;
                  setTitle(t);
                  if (!isEdit) setSlug(generateSlug(t));
                }}
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="auto-generated"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="coverImage">Cover Image</Label>
            <ImageUpload
              id="coverImage"
              value={coverImage}
              onChange={setCoverImage}
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-transparent"
              placeholder="Content description (HTML supported)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="isPublished"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
            <Label htmlFor="isPublished">Published</Label>
          </div>
        </CardContent>
      </Card>

      {/* Platforms */}
      {platforms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm md:text-base">Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => {
                const selected = selectedPlatformIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted border-input"
                    }`}
                  >
                    {p.name}
                    {selected && <X className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dynamic Fields grouped */}
      {Object.entries(grouped).map(([group, groupFields]) => (
        <Card key={group}>
          <CardHeader>
            <CardTitle className="text-sm md:text-base capitalize">{group.replace(/_/g, " ")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupFields.map((field) => {
                // Full-width for textarea, rich text, arrays
                const fullWidth = [
                  "TEXTAREA",
                  "RICH_TEXT",
                  "IMAGE_ARRAY",
                  "TEXT_ARRAY",
                ].includes(field.fieldType);

                return (
                  <div
                    key={field.id}
                    className={fullWidth ? "md:col-span-2" : ""}
                  >
                    <DynamicFieldRenderer
                      field={field}
                      value={fields[field.slug]}
                      onChange={(val) => updateField(field.slug, val)}
                      contentTypeId={contentTypeId}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm md:text-base">SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2.5">
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input
              id="metaTitle"
              placeholder="SEO title (optional)"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Input
              id="metaDescription"
              placeholder="SEO description (optional)"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      {!hideSubmit && (
        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={saving}>
            {saving
              ? "Saving..."
              : isEdit
                ? `Update ${contentTypeName}`
                : `Create ${contentTypeName}`}
          </Button>
        </div>
      )}
    </form>
  );
}
