import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  fetchContentTypesServer,
  fetchContentByTypeServer,
  fetchPlatformsServer,
  fetchCategoriesServer,
} from "@/lib/api";
import ContentListClient from "@/components/site/ContentListClient";

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const types = await fetchContentTypesServer();
    return types.map((t) => ({ contentType: t.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ contentType: string }>;
}): Promise<Metadata> {
  const { contentType: typeSlug } = await params;
  try {
    const types = await fetchContentTypesServer();
    const type = types.find((t) => t.slug === typeSlug);
    if (!type) return { title: "Browse" };
    return {
      title: `Browse ${type.name}`,
      description:
        type.description ||
        `Browse and download ${type.name} on ROMHAVEN. Free, fast, always updated.`,
      alternates: { canonical: `/${type.slug}` },
    };
  } catch {
    return { title: "Browse" };
  }
}

export default async function BrowseContentType({
  params,
}: {
  params: Promise<{ contentType: string }>;
}) {
  const { contentType: typeSlug } = await params;

  const types = await fetchContentTypesServer();
  const contentType = types.find((t) => t.slug === typeSlug);

  if (!contentType) {
    notFound();
  }

  const [contentRes, platforms, categories] = await Promise.all([
    fetchContentByTypeServer(typeSlug, { page: 1, limit: 24, sort: "newest" }),
    fetchPlatformsServer(),
    fetchCategoriesServer(typeSlug),
  ]);

  return (
    <ContentListClient
      contentType={contentType}
      initialItems={contentRes.data}
      initialTotal={contentRes.pagination.total}
      initialTotalPages={contentRes.pagination.totalPages}
      platforms={platforms}
      categories={categories}
    />
  );
}
