import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const protocol = incoming.get("x-forwarded-proto") ?? "https";
  const host =
    incoming.get("x-forwarded-host") ??
    incoming.get("host") ??
    "localhost:3000";
  const origin = `${protocol}://${host}`;

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
