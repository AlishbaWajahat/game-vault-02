"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Monitor,
  Gamepad2,
  Disc3,
  Shield,
  Smartphone,
  Gamepad,
  Joystick,
  TabletSmartphone,
  TvMinimalPlay,
  Orbit,
  Sparkles,
  Disc2,
  type LucideProps,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Monitor,
  Gamepad2,
  Disc3,
  Shield,
  Smartphone,
  Gamepad,
  Joystick,
  TabletSmartphone,
  TvMinimalPlay,
  Orbit,
  Sparkles,
  Disc2,
};

export function PlatformIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICON_MAP[name] ?? Gamepad2;
  return <Icon {...props} />;
}

export function Section({
  eyebrow,
  title,
  seeAll,
  children,
  contained,
}: {
  eyebrow?: string;
  title?: string;
  seeAll?: { label: string; to: string };
  children: ReactNode;
  contained?: boolean;
}) {
  const inner = (
    <>
      {(eyebrow || title || seeAll) && (
        <div className="flex items-end justify-between mb-5 sm:mb-6">
          <div>
            {eyebrow && <div className="eyebrow text-[11px] sm:text-[13px] mb-1">{eyebrow}</div>}
            {title && (
              <h2 className="text-[17px] sm:text-[22px] font-extrabold tracking-tight text-[#1A1A1A]">{title}</h2>
            )}
          </div>
          {seeAll && (
            <Link
              href={seeAll.to}
              className="text-[11px] sm:text-[14px] font-semibold text-[#555555] hover:text-[#468284] transition-colors shrink-0"
            >
              {seeAll.label} &rarr;
            </Link>
          )}
        </div>
      )}
      {children}
    </>
  );

  if (contained) {
    return (
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
        <div className="bg-[#555555]/30 backdrop-blur-sm border border-[#666666]/30 p-4 sm:p-8 shadow-sm">
          {inner}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
      {inner}
    </section>
  );
}

export function BackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      className="inline-flex items-center gap-1 text-[11px] sm:text-[12px] font-medium text-[#777] hover:text-[#1A1A1A] transition-colors mb-2"
    >
      <ArrowLeft size={13} /> Back
    </button>
  );
}

export function PageHeader({
  title,
  subtitle,
  children,
  showBack = false,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  showBack?: boolean;
}) {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-5 sm:pt-8 pb-3 sm:pb-4">
      {showBack && <BackButton />}
      <h1 className="text-[20px] sm:text-[28px] font-black tracking-tight text-[#1A1A1A]">{title}</h1>
      {subtitle && (
        <p className="text-[13px] sm:text-[14px] text-[#777] mt-1 sm:mt-1.5 max-w-2xl">{subtitle}</p>
      )}
      {children}
    </div>
  );
}
