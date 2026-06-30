import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request a Game",
  description:
    "Request a game, ROM, or software title to be added to ROMHAVEN. Most requests are reviewed within 48 hours.",
  alternates: { canonical: "/request-game" },
};

export default function RequestGameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
