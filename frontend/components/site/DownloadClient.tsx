"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fetchDownloadUrl } from "@/lib/api";
import type { ContentDetail } from "@/lib/types";
import { FALLBACK_COVER } from "@/lib/data";
import { ArrowLeft, Download, HardDrive, FileText } from "lucide-react";

function handleImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  img.srcset = "";
  img.src = FALLBACK_COVER;
}

interface DownloadClientProps {
  content: ContentDetail;
  contentTypeSlug: string;
}

export default function DownloadClient({ content, contentTypeSlug }: DownloadClientProps) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      const { downloadUrl } = await fetchDownloadUrl(content.slug);
      window.location.href = downloadUrl;
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false);
    }
  }

  const fileSize = content.totalFileSize || (content.fields?.fileSize as string | undefined);
  const f = content.fields || {};
  const systemReqMin = f.systemReqMin as string[] | undefined;
  const systemReqRec = f.systemReqRec as string[] | undefined;
  const showSysReqs = content.platform.includes("PC") && (systemReqMin || systemReqRec);
  const fileName = content.files?.[0]?.fileName;

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Back link */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-medium text-[#777] hover:text-[#1A1A1A] transition-colors mb-5 sm:mb-6"
      >
        <ArrowLeft size={14} /> Back to details
      </button>

      {/* Heading */}
      <h1 className="text-[22px] sm:text-[30px] font-black tracking-tight mb-6 sm:mb-8">
        <span className="text-[#777]">Romhaven</span>{" "}
        <span className="text-gradient">Download</span>
      </h1>

      {/* Content info card */}
      <div className="bg-[#555555] border border-[#666666] p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
        <div className="flex gap-4 sm:gap-6">
          {/* Cover thumbnail */}
          <div className="w-[90px] sm:w-[120px] shrink-0">
            <div className="relative aspect-[3/4] overflow-hidden bg-[#444444] border border-[#666666]">
              <Image
                src={content.coverImage || FALLBACK_COVER}
                alt={content.title}
                fill
                sizes="(max-width: 640px) 90px, 120px"
                className="object-cover"
                onError={handleImgError}
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-[16px] sm:text-[20px] font-bold text-white line-clamp-2">{content.title}</h2>
            <div className="text-[12px] sm:text-[13px] text-[#AAAAAA] mt-1">
              {content.platform.join(" \u00b7 ")}
            </div>

            {/* File details */}
            <div className="mt-3 sm:mt-4 space-y-1.5">
              {fileSize && (
                <div className="flex items-center gap-2 text-[12px] sm:text-[13px] text-[#CCCCCC]">
                  <HardDrive size={13} className="text-[#4fb38c] shrink-0" />
                  <span className="text-[#AAAAAA]">File Size:</span>
                  <span className="font-semibold text-white">{fileSize}</span>
                </div>
              )}
              {fileName && (
                <div className="flex items-center gap-2 text-[12px] sm:text-[13px] text-[#CCCCCC]">
                  <FileText size={13} className="text-[#4fb38c] shrink-0" />
                  <span className="text-[#AAAAAA]">File:</span>
                  <span className="font-semibold text-white truncate">{fileName}</span>
                </div>
              )}
            </div>

            {/* Download button */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="mt-4 sm:mt-5 w-full sm:w-auto h-[42px] sm:h-[46px] px-8 sm:px-10 bg-[#468284] hover:bg-[#3a6e70] text-white font-bold text-[14px] sm:text-[16px] inline-flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(70,130,132,0.3)]"
            >
              <Download size={18} />
              {downloading ? "Preparing..." : "Download"}
            </button>
          </div>
        </div>
      </div>

      {/* System Requirements */}
      {showSysReqs && (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-[18px] sm:text-[22px] font-bold text-[#1A1A1A] mb-3 sm:mb-4">System Requirements</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {([["min", systemReqMin], ["rec", systemReqRec]] as const).map(([k, reqs]) =>
              reqs && reqs.length > 0 ? (
                <div key={k} className="border border-[#666666] bg-[#555555] overflow-hidden shadow-sm">
                  <div className="px-4 py-2.5 border-b border-[#666666] bg-[#444444]">
                    <span className="text-[11px] font-bold text-[#4fb38c] uppercase tracking-wider">
                      {k === "min" ? "Minimum" : "Recommended"}
                    </span>
                  </div>
                  <ul className="p-4 space-y-1.5 font-mono text-[12px] text-[#CCCCCC]">
                    {reqs.map((r) => (
                      <li key={r} className="flex items-start gap-2">
                        <span className="text-[#4fb38c] mt-0.5">&#8226;</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}
    </div>
  );
}
