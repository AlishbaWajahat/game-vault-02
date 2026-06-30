import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { fetchArticlesServer } from "@/lib/api";
import { PageHeader } from "@/components/site/ui";
import { Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "Articles",
  description:
    "Guides, updates, and editorials about games, ROMs, and platforms on ROMHAVEN.",
  alternates: { canonical: "/articles" },
};

export const revalidate = 60;

export default async function ArticlesIndex() {
  const articles = await fetchArticlesServer().catch(() => []);

  return (
    <div>
      <PageHeader title="Articles" subtitle="Guides, updates, and editorials about games and platforms." showBack />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pb-8 sm:pb-12">
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {articles.map((a) => (
              <Link
                key={a.slug}
                href={`/articles/${a.slug}`}
                className="group overflow-hidden bg-[#555555] border border-[#666666] shadow-sm block"
              >
                <div className="relative overflow-hidden h-[160px] sm:h-[200px]">
                  {a.image ? (
                    <Image
                      src={a.image}
                      alt={a.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#F0F0F0]" />
                  )}
                  <span className="absolute top-2 left-2 sm:top-3 sm:left-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[#468284]/80 text-white backdrop-blur-sm">
                    {a.category}
                  </span>
                </div>
                <div className="p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#AAAAAA] mb-1.5 sm:mb-2">
                    <Calendar size={10} className="sm:w-[11px] sm:h-[11px] text-[#AAAAAA]" />
                    {a.date}
                  </div>
                  <h3 className="text-[14px] sm:text-[16px] font-bold text-white line-clamp-2 group-hover:text-[#468284] transition-colors">
                    {a.title}
                  </h3>
                  <p className="text-[12px] sm:text-[13px] text-[#AAAAAA] mt-1 sm:mt-1.5 line-clamp-2">{a.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center py-12 text-[#777]">No articles yet.</p>
        )}
      </div>
    </div>
  );
}
