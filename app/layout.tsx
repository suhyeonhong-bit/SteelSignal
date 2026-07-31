import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const fallbackSiteOrigin = "https://steel-signal.example";

function resolveSiteOrigin(value: string | undefined): string {
  if (!value || value !== value.trim()) {
    return fallbackSiteOrigin;
  }

  try {
    const url = new URL(value);
    const isCanonicalHttpsOrigin =
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash;

    return isCanonicalHttpsOrigin ? url.origin : fallbackSiteOrigin;
  } catch {
    return fallbackSiteOrigin;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  // Keep metadata request-time so Sites runtime environment updates are read
  // without rebuilding, while never deriving canonical URLs from the request.
  await headers();
  const origin = resolveSiteOrigin(process.env.SITE_ORIGIN);

  return {
    title: "STEEL SIGNAL | 금리와 철강 가격의 흐름",
    description:
      "한국 기준금리와 미국 철강 생산자물가지수의 최신 값과 5년 흐름을 한눈에 확인하세요.",
    openGraph: {
      title: "STEEL SIGNAL",
      description: "금리와 철강 가격의 흐름을 한눈에",
      type: "website",
      locale: "ko_KR",
      images: [{ url: `${origin}/og.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "STEEL SIGNAL",
      description: "금리와 철강 가격의 흐름을 한눈에",
      images: [`${origin}/og.png`],
    },
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
