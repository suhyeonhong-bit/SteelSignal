import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://suhyeonhong-bit.github.io/SteelSignal/"),
  title: "북극 에너지 패권, 이미 결정됐는가? | ARCTIC / YAMAL",
  description: "YAMAL LNG와 미국 북극 전략을 공식 데이터와 연구자 분석으로 추적하는 연구 대시보드.",
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "./",
    siteName: "ARCTIC / YAMAL",
    title: "북극 에너지 패권, 이미 결정됐는가?",
    description: "YAMAL LNG와 미국 북극 전략을 공식 데이터와 연구자 분석으로 추적하는 연구 대시보드.",
    images: [{ url: "https://suhyeonhong-bit.github.io/SteelSignal/arctic-og.png", width: 1731, height: 909, alt: "북극 에너지 패권 연구 대시보드 표지" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "북극 에너지 패권, 이미 결정됐는가?",
    description: "YAMAL LNG와 미국 북극 전략을 공식 데이터와 연구자 분석으로 추적합니다.",
    images: ["https://suhyeonhong-bit.github.io/SteelSignal/arctic-og.png"],
  },
  icons: {
    icon: "https://suhyeonhong-bit.github.io/SteelSignal/favicon.svg",
    shortcut: "https://suhyeonhong-bit.github.io/SteelSignal/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
