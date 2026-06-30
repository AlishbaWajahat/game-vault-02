import type { MetadataRoute } from "next";
import {
  fetchContentTypesServer,
  fetchContentByTypeServer,
  fetchArticlesServer,
  fetchPlatformsServer,
} from "@/lib/api";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://game-vault-nine-kappa.vercel.app");

function safeDate(value: unknown): Date {
  if (!value) return new Date();
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? new Date() : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static pages ──
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/platforms`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/articles`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/request-game`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // ── Content types and their items ──
  const contentEntries: MetadataRoute.Sitemap = [];
  const contentTypes = await fetchContentTypesServer().catch(() => []);

  for (const type of contentTypes) {
    // Content type listing page
    contentEntries.push({
      url: `${SITE_URL}/${type.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });

    // Individual content items
    try {
      const res = await fetchContentByTypeServer(type.slug, {
        limit: 1000,
        sort: "newest",
      });
      for (const item of res.data) {
        contentEntries.push({
          url: `${SITE_URL}/${type.slug}/${item.slug}`,
          lastModified: safeDate(item.updatedAt),
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    } catch {
      // skip on error
    }
  }

  // ── Platforms ──
  const platforms = await fetchPlatformsServer().catch(() => []);
  const platformEntries: MetadataRoute.Sitemap = platforms.map((p) => ({
    url: `${SITE_URL}/platforms/${p.slug}`,
    lastModified: safeDate(p.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // ── Articles ──
  const articles = await fetchArticlesServer().catch(() => []);
  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${SITE_URL}/articles/${a.slug}`,
    lastModified: safeDate(a.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...contentEntries,
    ...platformEntries,
    ...articleEntries,
  ];
}
