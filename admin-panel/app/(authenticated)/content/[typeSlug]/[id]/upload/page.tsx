"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileUploadSection } from "@/components/content/FileUploadSection";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface ContentData {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  contentType: { id: string; slug: string; name: string };
}

export default function UploadFilePage() {
  const params = useParams();
  const router = useRouter();
  const typeSlug = params.typeSlug as string;
  const contentId = params.id as string;

  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await api<{ success: boolean; data: ContentData }>(
          `/admin/content/${contentId}`,
        );
        setContent(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [contentId]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="space-y-4 md:space-y-6">
        <h1 className="text-lg md:text-2xl font-bold">Upload File</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">{error || "Content not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground">
          {content.contentType.name} created successfully
        </p>
        <h1 className="text-base md:text-2xl font-bold mt-1">
          Upload File for &ldquo;{content.title}&rdquo;
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload the downloadable file for this content. You can also do this
          later from the edit page.
        </p>
      </div>

      {/* File upload */}
      <FileUploadSection contentId={content.id} />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push(`/content/${typeSlug}`)}
        >
          Skip &mdash; I&apos;ll upload later
        </Button>
        <Button onClick={() => router.push(`/content/${typeSlug}`)}>
          <CheckCircle2 className="h-4 w-4 mr-1.5" />
          Done
        </Button>
      </div>
    </div>
  );
}
