import type { Metadata } from "next";
import { Space_Grotesk, Orbitron } from "next/font/google";
import { Layout } from "@/components/site/Layout";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  sharedOpenGraph,
  sharedTwitter,
  JsonLd,
  websiteJsonLd,
  organizationJsonLd,
} from "@/lib/seo";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Download Games for Every Platform`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    ...sharedOpenGraph,
    title: SITE_NAME,
    description: "Download games for every platform. Free. Always updated.",
    url: SITE_URL,
  },
  twitter: sharedTwitter,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${orbitron.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <JsonLd data={websiteJsonLd()} />
        <JsonLd data={organizationJsonLd()} />
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
