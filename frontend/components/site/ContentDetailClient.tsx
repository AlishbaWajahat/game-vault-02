"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { fetchContentByType } from "@/lib/api";
import type { ContentDetail, ContentItem } from "@/lib/types";
import { GameCard, GameCardLandscape } from "@/components/site/GameCard";
import { ScrollCarousel } from "@/components/site/ScrollCarousel";
import { FALLBACK_COVER } from "@/lib/data";
import {
  Download,
  Star,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Calendar,
  HardDrive,
  Cpu,
  Globe,
  Tag,
  User,
  Building,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

function formatDownloads(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return n.toString();
}

function handleImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  img.srcset = "";
  img.src = FALLBACK_COVER;
}

interface ContentDetailClientProps {
  content: ContentDetail;
  contentTypeSlug: string;
  initialRelated: ContentItem[];
}

export default function ContentDetailClient({ content, contentTypeSlug, initialRelated }: ContentDetailClientProps) {
  type InfoRow = {
    icon: ReactElement;
    label: string;
    value: string;
  };
  const router = useRouter();
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [lbIndex, setLbIndex] = useState(0);
  const [related, setRelated] = useState<ContentItem[]>(initialRelated);

  const f = content.fields || {};
  const genre = f.genre as string | undefined;
  const rating = f.rating as number | undefined;
  const developer = f.developer as string | undefined;
  const publisher = f.publisher as string | undefined;
  const fileSize = f.fileSize as string | undefined;
  const version = f.version as string | undefined;
  const romFormat = f.romFormat as string | undefined;
  const region = f.region as string | undefined;
  const languages = f.languages as string[] | undefined;
  const screenshots = (f.screenshots as string[]) || [];
  const likes = f.likes as number | undefined;
  const dislikes = f.dislikes as number | undefined;
  const isRom = f.isRom as boolean | undefined;
  const releaseDate = f.releaseDate as string | undefined;
  const platformSlug = content.platform[0]?.toLowerCase().split(" ")[0];
  const typeSlug = content.contentType?.slug || contentTypeSlug;

  const openLightbox = (idx: number) => {
    setLbIndex(idx);
    setLightbox(screenshots[idx]);
  };

  useEffect(() => {
    if (lightbox) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  return (
    <div>
      {/* Gradient header area */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#555555]/8 via-[#555555]/3 to-transparent pointer-events-none" />

        {/* Back + Breadcrumb */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-4 sm:pt-5 relative">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-medium text-[#777] hover:text-[#1A1A1A] transition-colors mb-2"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="text-[11px] sm:text-[12px] text-[#777] flex items-center gap-1.5">
            <Link href="/" className="hover:text-[#1A1A1A] transition-colors">Home</Link>
            <span className="text-[#BBB]">/</span>
            <Link href={`/platforms/${platformSlug}`} className="hover:text-[#1A1A1A] transition-colors">{content.platform[0]}</Link>
            <span className="text-[#BBB]">/</span>
            <span className="text-[#444] font-medium">{content.title}</span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-5 sm:py-6 relative">
          {/* Cover + Screenshots + Buttons — mobile (<600px) */}
          <div className="space-y-3 w-full max-w-[400px] mx-auto min-[600px]:hidden mb-6">
            <div className="relative">
              <div className="w-1/2">
                <div className="relative aspect-[3/4] overflow-hidden bg-[#444444] border border-[#666666] shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
                  <Image
                    src={content.coverImage || FALLBACK_COVER}
                    alt={content.title}
                    fill
                    sizes="(max-width: 600px) 50vw, 280px"
                    className="object-cover"
                    priority
                    onError={handleImgError}
                  />
                  {isRom && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-1 bg-[#468284] text-white shadow-lg">
                      ROM
                    </span>
                  )}
                </div>
              </div>
              {screenshots.length > 0 && (
                <div className="absolute top-0 left-[calc(50%+8px)] right-0 max-h-full overflow-y-auto space-y-2">
                  {screenshots.map((s, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); openLightbox(i); }}
                      className="relative block w-full aspect-video overflow-hidden bg-[#444444] border border-[#666666] hover:border-[#468284]/40 transition-all cursor-pointer"
                    >
                      <Image src={s} alt={`Screenshot ${i + 1}`} fill sizes="(max-width: 600px) 45vw, 300px" className="object-cover pointer-events-none" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5 mt-4">
              <Link href={`/${contentTypeSlug}/${content.slug}/download`} className="w-full h-[38px] bg-[#468284] hover:bg-[#3a6e70] text-white font-bold text-[15px] inline-flex items-center justify-center gap-4 transition-all active:scale-[0.98]">
                <img src="/download (1).svg" alt="" className="w-4 h-4 brightness-0" style={{ filter: "brightness(0)" }} /> Download Now
              </Link>
            </div>
          </div>

          {/* Details box */}
          <div className="bg-[#555555]/30 backdrop-blur-sm border border-[#666666]/30 p-5 sm:p-8 max-w-[500px] mx-auto min-[600px]:max-w-none min-[600px]:mx-0 min-[600px]:grid min-[600px]:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] min-[600px]:gap-x-10 min-[600px]:gap-y-0 lg:gap-x-16 lg:gap-y-0 shadow-sm">
            {/* Left: Cover + Buttons — visible from 600px */}
            <div className="hidden min-[600px]:block space-y-3">
              <div className="relative">
                <div className="w-full">
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#444444] border border-[#666666] shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
                    <Image
                      src={content.coverImage || FALLBACK_COVER}
                      alt={content.title}
                      fill
                      sizes="280px"
                      className="object-cover"
                      priority
                      onError={handleImgError}
                    />
                    {isRom && (
                      <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-1 bg-[#468284] text-white shadow-lg">
                        ROM
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 mt-4">
                <Link href={`/${contentTypeSlug}/${content.slug}/download`} className="w-full h-[36px] bg-[#468284] hover:bg-[#3a6e70] text-white font-bold text-[16px] inline-flex items-center justify-center gap-4 transition-all active:scale-[0.98]">
                  <img src="/download (1).svg" alt="" className="w-4 h-4" style={{ filter: "brightness(0)" }} /> Download Now
                </Link>
              </div>
            </div>

            {/* Right: Info */}
            <div>
              {/* Platform + Genre badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {content.platform.map((p) => (
                  <span key={p} className="badge-platform">{p}</span>
                ))}
                {genre && (
                  <span className="text-[11px] font-bold px-2.5 py-1 bg-[#468284] text-white border border-[#468284]">
                    {genre}
                  </span>
                )}
                {romFormat && (
                  <span className="text-[11px] font-bold px-2.5 py-1 bg-[#555555]/60 text-[#333333] border border-[#999999]/40">
                    {romFormat}
                  </span>
                )}
              </div>

              <h1 className="text-[22px] sm:text-[28px] md:text-[34px] font-black tracking-tight text-[#1A1A1A] leading-tight">
                {content.title}
              </h1>
              {(developer || publisher) && (
                <div className="text-[13px] sm:text-[15px] text-[#555555] mt-1 sm:mt-1.5">
                  {developer}{developer && publisher ? " \u00b7 " : ""}{publisher}
                </div>
              )}

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 sm:mt-5 pb-4 sm:pb-5 border-b border-[#999999]/40">
                {rating !== undefined && rating > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          fill={s <= Math.round(rating) ? "#b8860b" : "transparent"}
                          stroke={s <= Math.round(rating) ? "#b8860b" : "#999"}
                        />
                      ))}
                    </div>
                    <span className="text-[13px] font-bold text-[#b8860b]">{rating.toFixed(1)}</span>
                    <span className="text-[11px] text-[#777777]">/ 5</span>
                  </div>
                )}

                {rating !== undefined && <div className="w-px h-4 bg-[#999] hidden sm:block" />}

                {(likes !== undefined || dislikes !== undefined) && (
                  <div className="flex items-center gap-3">
                    {likes !== undefined && (
                      <button className="flex items-center gap-1.5 text-[12px] font-semibold text-[#468284] transition-colors">
                        <ThumbsUp size={14} />
                        <span>+{likes}</span>
                      </button>
                    )}
                    {dislikes !== undefined && (
                      <button className="flex items-center gap-1.5 text-[12px] font-semibold text-red-500 hover:text-red-600 transition-colors">
                        <ThumbsDown size={14} />
                        <span>{dislikes}</span>
                      </button>
                    )}
                  </div>
                )}

                <div className="w-px h-4 bg-[#999] hidden sm:block" />

                <div className="flex items-center gap-1.5 text-[12px] text-[#666666]">
                  <Download size={13} className="text-[#468284]" />
                  <span className="font-bold text-[#333333]">{formatDownloads(content.downloads)}</span>
                  <span>downloads</span>
                </div>

                <div className="w-px h-4 bg-[#999] hidden sm:block" />

                <button className="flex items-center gap-1.5 text-[12px] text-[#666666] hover:text-[#468284] transition-colors">
                  <Share2 size={13} /> Share
                </button>
              </div>

              {/* Description */}
              <p className="text-[14px] sm:text-[16px] text-[#444444] leading-relaxed mt-4">{content.description}</p>
            </div>

            {/* File Info Table */}
            {(() => {
              const infoRows: InfoRow[] = [
                genre ? { icon: <Tag size={11} />, label: "Genre", value: genre } : null,
                releaseDate ? { icon: <Calendar size={11} />, label: "Updated", value: releaseDate } : null,
                fileSize ? { icon: <HardDrive size={11} />, label: "File Size", value: fileSize } : null,
                version ? { icon: <Cpu size={11} />, label: "Version", value: version } : null,
                developer ? { icon: <User size={11} />, label: "Developer", value: developer } : null,
                publisher ? { icon: <Building size={11} />, label: "Publisher", value: publisher } : null,
                region ? { icon: <Globe size={11} />, label: "Region", value: region } : null,
                languages?.length
                  ? { icon: <Globe size={11} />, label: "Language", value: languages.join(", ") }
                  : null,
              ].filter(Boolean) as InfoRow[];

              if (infoRows.length === 0) return null;

              return (
                <div className="mt-5 sm:mt-6 border border-[#999999]/40 bg-[#444444]/70 overflow-hidden min-[600px]:col-span-full max-w-[340px] min-[500px]:max-w-none">
                  <div className="px-2.5 py-1.5 border-b border-[#999999]/40 bg-[#333333]/70">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                      {content.contentType?.name || "Game"} Information
                    </span>
                  </div>
                  <div className="grid grid-cols-1 min-[500px]:grid-cols-2">
                    {infoRows.map((row) => (
                      <div key={row.label} className="flex items-center gap-2 px-2.5 py-1.5 border-b border-[#999999]/30 last:border-0 text-[11px]">
                        <span className="text-[#4fb38c]">{row.icon}</span>
                        <span className="text-[#CCCCCC] w-[65px] shrink-0">{row.label}</span>
                        <span className="font-medium text-white">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Screenshots */}
      {screenshots.length > 0 && (
        <div className="max-w-[500px] min-[600px]:max-w-[1200px] mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
          <h2 className="text-[18px] sm:text-[22px] font-bold text-[#1A1A1A] mb-3 sm:mb-4 flex items-center gap-2">
            Screenshots
          </h2>
          <ScrollCarousel>
            {screenshots.map((s, i) => (
              <button
                key={i}
                onClick={() => openLightbox(i)}
                className="relative aspect-video overflow-hidden bg-[#444444] border border-[#666666] hover:border-[#468284]/40 transition-all shrink-0 w-[240px] sm:w-[320px]"
              >
                <Image
                  src={s}
                  alt={`Screenshot ${i + 1}`}
                  fill
                  sizes="(max-width: 640px) 240px, 320px"
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </button>
            ))}
          </ScrollCarousel>
        </div>
      )}

      {/* Related Content */}
      {related.length > 0 && (
        <div className="max-w-[500px] min-[600px]:max-w-[1200px] mx-auto px-4 sm:px-6 pb-8 sm:pb-12">
          <h2 className="text-[18px] sm:text-[22px] font-bold text-[#1A1A1A] mb-3 sm:mb-4">
            Related {content.contentType?.name || "Content"}
          </h2>
          <div className="min-[600px]:!hidden">
            <div className="carousel-auto-scroll">
              <div className="carousel-track">
                {related.map((g) => (
                  <div key={g.id} className="w-[150px] shrink-0">
                    <GameCard game={g} typeSlug={typeSlug} />
                  </div>
                ))}
                {related.map((g) => (
                  <div key={`dup-${g.id}`} className="w-[150px] shrink-0">
                    <GameCard game={g} typeSlug={typeSlug} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="hidden min-[600px]:!block">
            <ScrollCarousel>
              {related.map((g) => (
                <div key={g.id} className="w-[180px] shrink-0">
                  <GameCard game={g} typeSlug={typeSlug} />
                </div>
              ))}
            </ScrollCarousel>
          </div>
        </div>
      )}

      {/* Screenshot lightbox */}
      {lightbox && createPortal(
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center transition-colors"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            &times;
          </button>
          <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox}
              alt={`Screenshot ${lbIndex + 1}`}
              className="max-w-[95vw] max-h-[85vh] shadow-2xl"
            />
            {screenshots.length > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white inline-flex items-center justify-center transition-colors"
                  onClick={() => {
                    const prev = (lbIndex - 1 + screenshots.length) % screenshots.length;
                    setLbIndex(prev);
                    setLightbox(screenshots[prev]);
                  }}
                  aria-label="Previous screenshot"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white inline-flex items-center justify-center transition-colors"
                  onClick={() => {
                    const next = (lbIndex + 1) % screenshots.length;
                    setLbIndex(next);
                    setLightbox(screenshots[next]);
                  }}
                  aria-label="Next screenshot"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] bg-black/50 px-2 py-0.5 text-white/70 font-medium">
              {lbIndex + 1} / {screenshots.length}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
