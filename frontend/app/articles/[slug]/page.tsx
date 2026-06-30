import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { fetchArticleBySlugServer, fetchArticlesServer } from "@/lib/api";
import { Calendar, User, ArrowLeft } from "lucide-react";
import {
  SITE_URL,
  sharedOpenGraph,
  JsonLd,
  articleJsonLd,
  breadcrumbJsonLd,
} from "@/lib/seo";

export const revalidate = 120;

export async function generateStaticParams() {
  try {
    const articles = await fetchArticlesServer();
    return articles.map((a) => ({ slug: a.slug }));
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
    const article = await fetchArticleBySlugServer(slug);
    const title = article.title;
    const description = article.excerpt || article.title;
    const url = `${SITE_URL}/articles/${slug}`;

    return {
      title,
      description,
      openGraph: {
        ...sharedOpenGraph,
        title,
        description,
        url,
        type: "article",
        publishedTime: article.createdAt,
        modifiedTime: article.updatedAt,
        authors: [article.author],
        section: article.category,
        images: article.image ? [article.image] : [],
      },
      twitter: {
        card: article.image ? "summary_large_image" : "summary",
        title,
        description,
        images: article.image ? [article.image] : [],
      },
      alternates: { canonical: `/articles/${slug}` },
    };
  } catch {
    return { title: "Article" };
  }
}

export default async function ArticleDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let article;
  let related: Awaited<ReturnType<typeof fetchArticlesServer>> = [];
  try {
    const [a, all] = await Promise.all([
      fetchArticleBySlugServer(slug),
      fetchArticlesServer(),
    ]);
    article = a;
    related = all.filter((r) => r.slug !== a.slug).slice(0, 3);
  } catch {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[var(--text-primary)]">Article not found</h1>
          <Link href="/articles" className="mt-4 inline-block text-[#468284] font-semibold hover:text-[#4fb38c] transition-colors">
            Browse Articles &rarr;
          </Link>
        </div>
      </div>
    );
  }

  const pageUrl = `${SITE_URL}/articles/${slug}`;

  return (
    <>
      <JsonLd
        data={articleJsonLd({
          title: article.title,
          description: article.excerpt || article.title,
          image: article.image,
          author: article.author,
          datePublished: article.createdAt,
          dateModified: article.updatedAt,
          url: pageUrl,
          category: article.category,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: SITE_URL },
          { name: "Articles", url: `${SITE_URL}/articles` },
          { name: article.title, url: pageUrl },
        ])}
      />
      <article className="max-w-[720px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Link
          href="/articles"
          className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-3 sm:mb-4"
        >
          <ArrowLeft size={14} /> Back to Articles
        </Link>
        {article.image && (
          <div className="relative overflow-hidden mb-4 sm:mb-6 h-[180px] sm:h-[300px]">
            <Image
              src={article.image}
              alt={article.title}
              fill
              sizes="(max-width: 720px) 100vw, 720px"
              className="object-cover"
              priority
            />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[11px] sm:text-[12px] text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-1">
            <Calendar size={11} /> {article.date}
          </span>
          <span className="inline-flex items-center gap-1">
            <User size={11} /> {article.author}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 bg-[#468284]/15 text-[#468284]">
            {article.category}
          </span>
        </div>
        <h1 className="text-[22px] sm:text-[28px] font-black mt-2 sm:mt-3 tracking-tight text-[var(--text-primary)] leading-tight">{article.title}</h1>
        <div
          className="article-body mt-4 sm:mt-6"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />

        {related.length > 0 && (
          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-[var(--border)]">
            <div className="eyebrow mb-3">Related Articles</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {related.map((a) => (
                <Link
                  key={a.slug}
                  href={`/articles/${a.slug}`}
                  className="border border-[var(--border)] bg-[var(--card)] overflow-hidden card-glow block"
                >
                  {a.image && (
                    <div className="relative h-[80px] sm:h-[100px]">
                      <Image src={a.image} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw" className="object-cover" />
                    </div>
                  )}
                  <div className="p-2.5 sm:p-3">
                    <div className="text-[11px] sm:text-[12px] font-bold text-[var(--text-primary)] line-clamp-2">{a.title}</div>
                    <div className="text-[9px] sm:text-[10px] text-[var(--text-muted)] mt-1">{a.date}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </>
  );
}
