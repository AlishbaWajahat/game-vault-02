import type { Metadata } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3002");
export const SITE_NAME = "ROMHAVEN";
export const SITE_DESCRIPTION =
  "Your curated archive of ROMs, PC games, and indie titles. Browse and download across every platform.";

// ── Shared metadata defaults ──

export const sharedOpenGraph: Metadata["openGraph"] = {
  siteName: SITE_NAME,
  locale: "en_US",
  type: "website",
};

export const sharedTwitter: Metadata["twitter"] = {
  card: "summary_large_image",
};

// ── JSON-LD helpers ──

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
  };
}

export function breadcrumbJsonLd(
  items: { name: string; url: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function articleJsonLd(article: {
  title: string;
  description: string;
  image?: string;
  author: string;
  datePublished: string;
  dateModified: string;
  url: string;
  category?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    ...(article.image ? { image: article.image } : {}),
    author: { "@type": "Person", name: article.author },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.ico` },
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    mainEntityOfPage: article.url,
    ...(article.category ? { articleSection: article.category } : {}),
  };
}

export function softwareAppJsonLd(content: {
  title: string;
  description: string;
  image?: string;
  platform: string[];
  url: string;
  fileSize?: string;
  rating?: number;
  downloads?: number;
  datePublished?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: content.title,
    description: content.description,
    ...(content.image ? { image: content.image } : {}),
    url: content.url,
    applicationCategory: "Game",
    operatingSystem: content.platform.join(", "),
    ...(content.fileSize ? { fileSize: content.fileSize } : {}),
    ...(content.datePublished
      ? { datePublished: content.datePublished }
      : {}),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    ...(content.rating && content.rating > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: content.rating,
            bestRating: "5",
            worstRating: "1",
            ratingCount: Math.max(content.downloads || 1, 1),
          },
        }
      : {}),
  };
}
