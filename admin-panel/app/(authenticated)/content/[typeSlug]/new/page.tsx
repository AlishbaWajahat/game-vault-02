"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { getCache, setCache } from "@/lib/page-cache";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DynamicContentForm } from "@/components/content/DynamicContentForm";
import type { FieldDefinition } from "@/components/content/DynamicFieldRenderer";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface ContentType {
  id: string;
  slug: string;
  name: string;
}

export default function CreateContentPage() {
  const params = useParams();
  const router = useRouter();
  const typeSlug = params.typeSlug as string;

  const _cached = getCache<{ contentType: ContentType; fieldDefinitions: FieldDefinition[] }>(`create-${typeSlug}`);
  const [contentType, setContentType] = useState<ContentType | null>(_cached?.contentType ?? null);
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>(_cached?.fieldDefinitions ?? []);
  const [loading, setLoading] = useState(!_cached);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const typesRes = await api<{ success: boolean; data: ContentType[] }>(
          "/admin/content-types",
        );
        const ct = typesRes.data.find((t) => t.slug === typeSlug);
        if (!ct) {
          setError(`Content type "${typeSlug}" not found`);
          return;
        }
        setContentType(ct);

        const fieldsRes = await api<{ success: boolean; data: FieldDefinition[] }>(
          `/admin/content-types/${ct.id}/fields`,
        );
        setFieldDefinitions(fieldsRes.data);
        setCache(`create-${typeSlug}`, { contentType: ct, fieldDefinitions: fieldsRes.data });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [typeSlug]);

  async function handleSave(data: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await api<{ success: boolean; data: { id: string } }>("/admin/content", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast.success(`"${(data.title as string) || "Content"}" created successfully`);
      router.push(`/content/${typeSlug}/${res.data.id}/upload`);
    } catch (err: unknown) {
      // Handle DUPLICATE_IN_SHARED_DB specially
      if (err instanceof ApiError && err.status === 409) {
        // The DynamicContentForm handles the fuzzy match UI,
        // but this catches the exact slug match from the backend
        toast.error(
          "Content with this slug already exists. Check the suggestions above or use a different slug.",
        );
      } else {
        toast.error(
          err instanceof ApiError ? err.message : "Failed to create",
        );
      }
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

  if (error || !contentType) {
    return (
      <div className="space-y-4 md:space-y-6">
        <h1 className="text-lg md:text-2xl font-bold">Create Content</h1>
        <Card>
          <CardContent className="p-3 md:p-6">
            <p className="text-destructive">{error || "Content type not found"}</p>
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
        <h1 className="text-base md:text-2xl font-bold">
          New {contentType.name}
        </h1>
      </div>

      <DynamicContentForm
        contentTypeId={contentType.id}
        contentTypeName={contentType.name}
        fieldDefinitions={fieldDefinitions}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
