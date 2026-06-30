"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { getCache, setCache } from "@/lib/page-cache";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DynamicContentForm } from "@/components/content/DynamicContentForm";
import { FileUploadSection } from "@/components/content/FileUploadSection";
import type { FieldDefinition } from "@/components/content/DynamicFieldRenderer";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface ContentType {
  id: string;
  slug: string;
  name: string;
}

interface ContentData {
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
  contentType: ContentType;
}

export default function EditContentPage() {
  const params = useParams();
  const router = useRouter();
  const typeSlug = params.typeSlug as string;
  const contentId = params.id as string;

  const _cached = getCache<{ contentType: ContentType; content: ContentData; fieldDefinitions: FieldDefinition[] }>(`edit-${contentId}`);
  const [contentType, setContentType] = useState<ContentType | null>(_cached?.contentType ?? null);
  const [content, setContent] = useState<ContentData | null>(_cached?.content ?? null);
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>(_cached?.fieldDefinitions ?? []);
  const [loading, setLoading] = useState(!_cached);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        // Fetch content details
        const contentRes = await api<{ success: boolean; data: ContentData }>(
          `/admin/content/${contentId}`,
        );
        setContent(contentRes.data);
        setContentType(contentRes.data.contentType);

        // Fetch field definitions
        const fieldsRes = await api<{
          success: boolean;
          data: FieldDefinition[];
        }>(`/admin/content-types/${contentRes.data.contentType.id}/fields`);
        setFieldDefinitions(fieldsRes.data);
        setCache(`edit-${contentId}`, { contentType: contentRes.data.contentType, content: contentRes.data, fieldDefinitions: fieldsRes.data });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [contentId]);

  async function handleSave(data: Record<string, unknown>) {
    setSaving(true);
    try {
      await api(`/admin/content/${contentId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      toast.success(`${contentType?.name || "Content"} updated`);
      router.push(`/content/${typeSlug}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Skeleton className="h-7 w-40" />
        <Card>
          <CardContent className="p-3 md:p-6 space-y-3 md:space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !content || !contentType) {
    return (
      <div className="space-y-4 md:space-y-6">
        <h1 className="text-lg md:text-2xl font-bold">Edit Content</h1>
        <Card>
          <CardContent className="p-3 md:p-6">
            <p className="text-destructive">
              {error || "Content not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-4xl">
      <div className="flex items-center gap-2 md:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:h-10 md:w-10"
          onClick={() => router.push(`/content/${typeSlug}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-base md:text-2xl font-bold leading-tight">
          Edit {contentType.name}: {content.title}
        </h1>
      </div>

      <DynamicContentForm
        contentTypeId={contentType.id}
        contentTypeName={contentType.name}
        fieldDefinitions={fieldDefinitions}
        initialData={{
          id: content.id,
          title: content.title,
          slug: content.slug,
          coverImage: content.coverImage || "",
          description: content.description || "",
          isPublished: content.isPublished,
          metaTitle: content.metaTitle || "",
          metaDescription: content.metaDescription || "",
          platformIds: content.platformIds || [],
          fields: (content.fields as Record<string, unknown>) || {},
        }}
        onSave={handleSave}
        saving={saving}
        hideSubmit
        formId="edit-content-form"
      />

      {/* File Upload — only available after content is created */}
      <FileUploadSection contentId={content.id} />

      {/* Submit button after file upload */}
      <div className="flex justify-end gap-3">
        <Button type="submit" form="edit-content-form" disabled={saving}>
          {saving ? "Saving..." : `Update ${contentType.name}`}
        </Button>
      </div>
    </div>
  );
}
