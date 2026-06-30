import Link from "next/link";
import type { Metadata } from "next";
import {
  fetchPlatformBySlugServer,
  fetchPlatformsServer,
  fetchCategoriesServer,
} from "@/lib/api";
import PlatformDetailClient from "@/components/site/PlatformDetailClient";
import { SITE_URL, sharedOpenGraph, JsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const platforms = await fetchPlatformsServer();
    return platforms.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const platform = await fetchPlatformBySlugServer(slug);
    const title = `${platform.name} Games`;
    const description =
      platform.description ||
      `Browse and download ${platform.name} titles on ROMHAVEN. Free, fast, always updated.`;

    return {
      title,
      description,
      openGraph: {
        ...sharedOpenGraph,
        title,
        description,
        url: `${SITE_URL}/platforms/${slug}`,
      },
      alternates: { canonical: `/platforms/${slug}` },
    };
  } catch {
    return { title: "Platform" };
  }
}

export default async function PlatformDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let platform;
  try {
    platform = await fetchPlatformBySlugServer(slug);
  } catch {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[var(--text-primary)]">Platform not found</h1>
          <Link href="/platforms" className="mt-4 inline-block text-[#468284] font-semibold hover:text-[#4fb38c] transition-colors">
            Browse Platforms &rarr;
          </Link>
        </div>
      </div>
    );
  }

  const categories = await fetchCategoriesServer().catch(() => []);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: SITE_URL },
          { name: "Platforms", url: `${SITE_URL}/platforms` },
          { name: platform.name, url: `${SITE_URL}/platforms/${slug}` },
        ])}
      />
      <PlatformDetailClient platform={platform} categories={categories} />
    </>
  );
}
