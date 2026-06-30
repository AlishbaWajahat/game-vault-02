import Link from "next/link";
import type { Metadata } from "next";
import { fetchContentBySlugServer } from "@/lib/api";
import DownloadClient from "@/components/site/DownloadClient";
import { SITE_URL, sharedOpenGraph, JsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ contentType: string; slug: string }>;
}): Promise<Metadata> {
  const { contentType: contentTypeSlug, slug } = await params;
  try {
    const content = await fetchContentBySlugServer(slug);
    const title = `Download ${content.title}`;
    const description = `Download ${content.title} for ${content.platform.join(", ")} from ROMHAVEN. Free and fast.`;

    return {
      title,
      description,
      openGraph: {
        ...sharedOpenGraph,
        title,
        description,
        url: `${SITE_URL}/${contentTypeSlug}/${slug}/download`,
        images: content.coverImage ? [content.coverImage] : [],
      },
      alternates: { canonical: `/${contentTypeSlug}/${slug}/download` },
      robots: { index: true, follow: true },
    };
  } catch {
    return { title: "Download" };
  }
}

export default async function DownloadPage({
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
          <Link href={`/${contentTypeSlug}`} className="mt-4 inline-block text-[#468284] font-semibold hover:text-[#4fb38c] transition-colors">
            Go back &rarr;
          </Link>
        </div>
      </div>
    );
  }

  const pageUrl = `${SITE_URL}/${contentTypeSlug}/${slug}/download`;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: SITE_URL },
          {
            name: content.contentType?.name || contentTypeSlug,
            url: `${SITE_URL}/${contentTypeSlug}`,
          },
          {
            name: content.title,
            url: `${SITE_URL}/${contentTypeSlug}/${slug}`,
          },
          { name: "Download", url: pageUrl },
        ])}
      />
      <DownloadClient content={content} contentTypeSlug={contentTypeSlug} />
    </>
  );
}
