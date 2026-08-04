import type { Metadata } from "next";
import SteelSignalLatest from "../components/SteelSignalLatest";

export const metadata: Metadata = {
  title: "STEEL SIGNAL | 금리와 철강 가격의 흐름",
  description: "한국과 미국의 금리, 철강 생산자물가를 한눈에 읽는 월별 시장 브리프.",
  alternates: { canonical: "/steel/" },
  openGraph: {
    url: "/steel/",
    siteName: "STEEL SIGNAL",
    title: "STEEL SIGNAL | 금리와 철강 가격의 흐름",
    description: "한국과 미국의 금리, 철강 생산자물가를 한눈에 읽는 월별 시장 브리프.",
    images: [{ url: "https://suhyeonhong-bit.github.io/SteelSignal/og.png", width: 1200, height: 630, alt: "STEEL SIGNAL 대시보드 표지" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "STEEL SIGNAL | 금리와 철강 가격의 흐름",
    description: "한국과 미국의 금리, 철강 생산자물가를 한눈에 읽는 월별 시장 브리프.",
    images: ["https://suhyeonhong-bit.github.io/SteelSignal/og.png"],
  },
};

export default function SteelPage() {
  return <SteelSignalLatest />;
}
