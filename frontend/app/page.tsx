import {
  fetchContentTypesServer,
  fetchPlatformsServer,
  fetchSettingsServer,
  fetchContentByTypeServer,
} from "@/lib/api";
import HomeClient from "@/components/site/HomeClient";

export const revalidate = 60;

export default async function Home() {
  const [contentTypes, platforms, settings] = await Promise.all([
    fetchContentTypesServer(),
    fetchPlatformsServer(),
    fetchSettingsServer().catch(() => ({})),
  ]);

  // Fetch content for all content types in parallel
  const allTypeContent = await Promise.all(
    contentTypes.map(async (type) => {
      const [trendingRes, latestRes, popularRes] = await Promise.all([
        fetchContentByTypeServer(type.slug, { limit: 6, filters: { isTrending: "true" }, sort: "newest" }),
        fetchContentByTypeServer(type.slug, { limit: 12, sort: "newest" }),
        fetchContentByTypeServer(type.slug, { limit: 12, filters: { isPopular: "true" }, sort: "downloads" }),
      ]);
      return {
        type,
        trending: trendingRes.data,
        latest: latestRes.data,
        popular: popularRes.data,
      };
    })
  );

  const typeContents = allTypeContent.filter((tc) => tc.latest.length > 0 || tc.popular.length > 0);

  return (
    <HomeClient
      typeContents={typeContents}
      platforms={platforms}
      contentTypes={contentTypes}
      settings={settings}
    />
  );
}
