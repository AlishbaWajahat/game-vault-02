import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search ROMHAVEN for games, ROMs, software, and articles across every platform.",
  robots: { index: false, follow: true },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
