"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TrendingUp, Gamepad2, Star, Search } from "lucide-react";
import type { ContentItem, Platform, ContentType } from "@/lib/types";
import { getPlatformColors } from "@/lib/types";
import { GameCard, GameCardLandscape } from "@/components/site/GameCard";
import { Section, PlatformIcon } from "@/components/site/ui";
import { ScrollCarousel } from "@/components/site/ScrollCarousel";

interface TypeContent {
  type: ContentType;
  trending: ContentItem[];
  latest: ContentItem[];
  popular: ContentItem[];
}

interface HomeClientProps {
  typeContents: TypeContent[];
  platforms: Platform[];
  contentTypes: ContentType[];
  settings: Record<string, string>;
}

export default function HomeClient({ typeContents, platforms, contentTypes, settings }: HomeClientProps) {
  const router = useRouter();
  const [heroQuery, setHeroQuery] = useState("");
  const primaryType = contentTypes[0];
  const browseHref = primaryType ? `/${primaryType.slug}` : "/";
  const typeName = primaryType?.name || "Games";
  const primaryContent = typeContents.find((tc) => tc.type.slug === primaryType?.slug);

  return (
    <div>
      {/* Hero — teal green shade from top fading to light gray */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#4fb38c] via-[#7ecbaa] to-[#E8E8E8]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#468284]/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-8 relative">
          {/* Single row: title + search + buttons all inline */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
            {/* Title */}
            <h1 className="text-[18px] sm:text-[28px] md:text-[34px] font-black tracking-tight text-white leading-[1.15] shrink-0">
              {settings.homepage_hero_title || "Your Ultimate Destination for Games & Software"}
            </h1>

            {/* Search bar — grows to fill */}
            <form
              className="relative flex-1 w-full lg:w-auto lg:min-w-[280px] flex"
              onSubmit={(e) => {
                e.preventDefault();
                if (heroQuery.trim()) {
                  router.push(`/search?q=${encodeURIComponent(heroQuery.trim())}`);
                  setHeroQuery("");
                }
              }}
            >
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999999]" />
                <input
                  value={heroQuery}
                  onChange={(e) => setHeroQuery(e.target.value)}
                  className="w-full h-[36px] sm:h-[42px] pl-9 sm:pl-10 pr-3 sm:pr-4 bg-white/20 border border-white/30 border-r-0 text-[12px] sm:text-[13px] text-white placeholder-[#999999] outline-none focus:border-white focus:ring-1 focus:ring-white/30 transition-all"
                  placeholder="Search games, platforms, genres..."
                />
              </div>
              <button
                type="submit"
                className="h-[36px] sm:h-[42px] px-3 sm:px-5 bg-[#468284] hover:bg-[#3a6e70] text-white font-bold text-[11px] sm:text-[13px] inline-flex items-center justify-center gap-1 sm:gap-1.5 transition-colors shrink-0"
              >
                <Search size={13} className="sm:w-[14px] sm:h-[14px]" />
                Search
              </button>
            </form>

            {/* Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 w-full lg:w-auto">
              <Link
                href={browseHref}
                className="flex-1 lg:flex-none h-[34px] sm:h-[42px] px-3 sm:px-5 bg-[#468284] hover:bg-[#3a6e70] text-white font-bold text-[11px] sm:text-[13px] inline-flex items-center justify-center gap-1.5 sm:gap-2 transition-colors"
              >
                <Gamepad2 size={13} className="sm:w-[15px] sm:h-[15px]" /> Browse {typeName}
              </Link>
              <Link
                href="/platforms"
                className="flex-1 lg:flex-none h-[34px] sm:h-[42px] px-3 sm:px-5 bg-white/20 border border-white/30 text-white hover:bg-white/30 font-semibold text-[11px] sm:text-[13px] inline-flex items-center justify-center gap-1.5 sm:gap-2 transition-all"
              >
                All Platforms
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trending strip — wide landscape cards */}
      {primaryContent && primaryContent.trending.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-7">
          <div className="flex items-center justify-between mb-3 sm:mb-5">
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <TrendingUp size={13} className="text-[#468284] sm:w-[17px] sm:h-[17px]" />
              <span className="text-[11px] sm:text-[15px] font-extrabold text-[#1A1A1A] uppercase tracking-wider">Trending Now</span>
            </div>
            <Link href={browseHref} className="text-[10px] sm:text-[13px] font-semibold text-[#555555] hover:text-[#468284] transition-colors">
              View All &rarr;
            </Link>
          </div>
          <ScrollCarousel>
            {primaryContent.trending.map((g) => (
              <Link
                key={g.id}
                href={`/${primaryType?.slug || "games"}/${g.slug}`}
                className="group block overflow-hidden transition-all bg-[#555555] shadow-sm"
                style={{ minWidth: "clamp(140px, 30vw, 200px)", width: "clamp(140px, 30vw, 200px)" }}
              >
                {g.coverImage && (
                  <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#444444]">
                    <Image src={g.coverImage} alt={g.title} fill sizes="150px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                )}
                <div className="px-2 py-1.5 sm:px-2.5 sm:py-2">
                  <div className="text-[10px] sm:text-[11px] font-bold text-white line-clamp-1 group-hover:text-[#4fb38c] transition-colors">{g.title}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] sm:text-[10px] text-[#AAAAAA]">{g.platform[0]}</span>
                    {g.fields?.rating && (
                      <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px] text-[#facc15]">
                        <Star size={8} fill="#facc15" stroke="#facc15" />
                        {Number(g.fields.rating).toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </ScrollCarousel>
        </section>
      )}

      {/* Latest section */}
      {typeContents.some((tc) => tc.latest.length > 0) && (
        <Section
          eyebrow="New Releases"
          title={typeContents.length === 1 ? `Latest ${typeContents[0].type.name}` : "Latest Additions"}
          seeAll={typeContents.length === 1 ? { label: `Browse ${typeContents[0].type.name}`, to: `/${typeContents[0].type.slug}` } : undefined}
        >
          <div className="space-y-6">
            {typeContents.map((tc) => {
              if (tc.latest.length === 0) return null;
              const isGame = tc.type.slug === "games";
              return (
                <div key={tc.type.slug}>
                  {typeContents.length > 1 && (
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[13px] sm:text-[15px] font-bold text-[#444]">{tc.type.name}</span>
                      <Link
                        href={`/${tc.type.slug}`}
                        className="text-[11px] sm:text-[13px] font-semibold text-[#555555] hover:text-[#468284] transition-colors"
                      >
                        Browse {tc.type.name} &rarr;
                      </Link>
                    </div>
                  )}
                  <div className={`grid gap-3 sm:gap-5 ${isGame ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}`}>
                    {tc.latest.map((g) => (
                      isGame
                        ? <GameCard key={g.id} game={g} typeSlug={tc.type.slug} />
                        : <GameCardLandscape key={g.id} game={g} typeSlug={tc.type.slug} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Most Downloaded section */}
      {typeContents.some((tc) => tc.popular.length > 0) && (
        <Section
          eyebrow="Most Downloaded"
          title={typeContents.length === 1 ? `Popular ${typeContents[0].type.name}` : "Popular Titles"}
          seeAll={typeContents.length === 1 ? { label: `Browse ${typeContents[0].type.name}`, to: `/${typeContents[0].type.slug}` } : undefined}
          contained
        >
          {typeContents.length === 1 ? (() => {
            const isGame = typeContents[0].type.slug === "games";
            return (
              <div className={`grid gap-3 sm:gap-5 ${isGame ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}`}>
                {typeContents[0].popular.map((g) => (
                  isGame
                    ? <GameCard key={g.id} game={g} typeSlug={typeContents[0].type.slug} />
                    : <GameCardLandscape key={g.id} game={g} typeSlug={typeContents[0].type.slug} />
                ))}
              </div>
            );
          })() : (
            <div className="space-y-6">
              {typeContents.map((tc) => {
                if (tc.popular.length === 0) return null;
                const isGame = tc.type.slug === "games";
                return (
                  <div key={tc.type.slug}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[13px] sm:text-[15px] font-bold text-[#444]">{tc.type.name}</span>
                      <Link
                        href={`/${tc.type.slug}`}
                        className="text-[11px] sm:text-[13px] font-semibold text-[#555555] hover:text-[#468284] transition-colors"
                      >
                        Browse {tc.type.name} &rarr;
                      </Link>
                    </div>
                    <div className={`grid gap-3 sm:gap-5 ${isGame ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}`}>
                      {tc.popular.map((g) => (
                        isGame
                          ? <GameCard key={g.id} game={g} typeSlug={tc.type.slug} />
                          : <GameCardLandscape key={g.id} game={g} typeSlug={tc.type.slug} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      )}

      {/* Browse by Platform */}
      {platforms.length > 0 && (
        <Section
          eyebrow="Platforms"
          title="Browse by Platform"
          seeAll={{ label: "All Platforms", to: "/platforms" }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {platforms.slice(0, 4).map((p) => {
              const colors = getPlatformColors(p.slug);
              return (
                <Link
                  key={p.slug}
                  href={`/platforms/${p.slug}`}
                  className="group bg-[#555555] border border-[#666666] p-4 sm:p-5 card-glow flex items-center gap-3 sm:gap-4 shadow-sm"
                >
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 inline-grid place-items-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${p.color || colors.color}, ${colors.colorLight})` }}
                  >
                    <PlatformIcon name={p.icon || "Gamepad2"} className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] sm:text-[16px] font-bold text-white truncate">{p.name}</div>
                    <div className="text-[12px] sm:text-[13px] text-[#AAAAAA]">{p.count.toLocaleString()} titles</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}
