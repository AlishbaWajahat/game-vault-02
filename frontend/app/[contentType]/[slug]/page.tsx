import Link from "next/link";
import type { Metadata } from "next";
import {
  fetchContentBySlugServer,
  fetchContentByTypeServer,
  fetchContentTypesServer,
} from "@/lib/api";
import ContentDetailClient from "@/components/site/ContentDetailClient";
import {
  SITE_URL,
  sharedOpenGraph,
  JsonLd,
  softwareAppJsonLd,
  breadcrumbJsonLd,
} from "@/lib/seo";

export const revalidate = 120;

export async function generateStaticParams() {
  try {
    const types = await fetchContentTypesServer();
    const allParams: { contentType: string; slug: string }[] = [];
    for (const type of types) {
      try {
        const res = await fetchContentByTypeServer(type.slug, { limit: 100, sort: "newest" });
        for (const item of res.data) {
          allParams.push({ contentType: type.slug, slug: item.slug });
        }
      } catch {
        // skip type on error
      }
    }
    return allParams;
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ contentType: string; slug: string }>;
}): Promise<Metadata> {
  const { contentType: contentTypeSlug, slug } = await params;
  try {
    const content = await fetchContentBySlugServer(slug);
    const title =
      (content.fields?.metaTitle as string) || content.title;
    const description =
      (content.fields?.metaDescription as string) || content.description;
    const url = `${SITE_URL}/${contentTypeSlug}/${slug}`;

    return {
      title,
      description,
      openGraph: {
        ...sharedOpenGraph,
        title,
        description,
        url,
        type: "article",
        images: content.coverImage ? [content.coverImage] : [],
      },
      twitter: {
        card: content.coverImage ? "summary_large_image" : "summary",
        title,
        description,
        images: content.coverImage ? [content.coverImage] : [],
      },
      alternates: { canonical: `/${contentTypeSlug}/${slug}` },
    };
  } catch {
    return { title: "Content" };
  }
}

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ contentType: string; slug: string }>;
}) {
  const { contentType: contentTypeSlug, slug } = await params;

  let content;
  try {
    content = await fetchContentBySlugServer(slug);
  } catch {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[var(--text-primary)]">Content not found</h1>
          <p className="mt-2 text-[var(--text-muted)]">The page you&apos;re looking for doesn&apos;t exist.</p>
          <Link href={`/${contentTypeSlug}`} className="mt-4 inline-block text-[#468284] font-semibold hover:text-[#4fb38c] transition-colors">
            Go back &rarr;
          </Link>
        </div>
      </div>
    );
  }

  const genre = content.fields?.genre as string | undefined;
  const typeSlug = content.contentType?.slug || contentTypeSlug;
  const platformSlug = content.platform[0]?.toLowerCase().split(" ")[0];
  const pageUrl = `${SITE_URL}/${contentTypeSlug}/${slug}`;

  let related: typeof content extends { id: string } ? any[] : any[] = [];
  if (genre && typeSlug) {
    try {
      const res = await fetchContentByTypeServer(typeSlug, { limit: 6, filters: { genre } });
      related = res.data.filter((g) => g.slug !== content.slug);
    } catch {
      // skip related on error
    }
  }

  return (
    <>
      <JsonLd
        data={softwareAppJsonLd({
          title: content.title,
          description: content.description,
          image: content.coverImage,
          platform: content.platform,
          url: pageUrl,
          fileSize: content.totalFileSize,
          rating: content.fields?.rating as number | undefined,
          downloads: content.downloads,
          datePublished: content.createdAt,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: SITE_URL },
          ...(platformSlug
            ? [
                {
                  name: content.platform[0],
                  url: `${SITE_URL}/platforms/${platformSlug}`,
                },
              ]
            : []),
          { name: content.title, url: pageUrl },
        ])}
      />
      <ContentDetailClient
        content={content}
        contentTypeSlug={contentTypeSlug}
        initialRelated={related}
      />
    </>
  );
}
