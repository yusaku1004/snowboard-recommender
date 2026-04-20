import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SnowParticles } from "@/components/ui/SnowParticles";
import { MountainSilhouette } from "@/components/ui/MountainSilhouette";
import { SITE_URL } from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "スノーボード診断 | 85ブランド1,000本以上からあなたにぴったりの板を提案",
  description:
    "身長・体重・滑走スタイル（グラトリ・パーク・カービング・ラントリ・パウダー）を入力するだけで、85ブランド1,000本以上の2026年モデルからあなたに最適なスノーボードとサイズをAIがレコメンド。初心者から上級者まで無料で利用できます。",
  keywords: [
    "スノーボード",
    "おすすめ",
    "診断",
    "レコメンド",
    "板選び",
    "サイズ",
    "グラトリ",
    "パーク",
    "カービング",
    "パウダー",
    "ラントリ",
    "初心者",
    "スノボ",
    "2026",
    "板 選び方",
    "スノーボード サイズ",
  ],
  verification: {
    google: "CmmULHojpdB126dotTMvLk5bN04KxbSZkmydlmJUNE0",
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "スノーボード診断",
    title: "スノーボード診断 | 85ブランド1,000本以上からぴったりの板を提案",
    description:
      "身長・体重・滑走スタイルを入力するだけで、85ブランド1,000本以上の2026年モデルから最適なスノーボードとサイズを無料でレコメンド。",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "スノーボード診断 - 85ブランド1,000本以上からあなたにぴったりの板を見つけよう",
      },
    ],
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "スノーボード診断 | 85ブランド1,000本以上からぴったりの板を提案",
    description:
      "身長・体重・滑走スタイルを入力するだけで、85ブランド1,000本以上の2026年モデルから最適なスノーボードとサイズを無料でレコメンド。",
    images: ["/opengraph-image"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "スノーボード診断",
  url: SITE_URL,
  description:
    "身長・体重・滑走スタイルを入力するだけで、85ブランド1,000本以上の2026年モデルから最適なスノーボードとサイズを無料でレコメンド。",
  applicationCategory: "SportsApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "JPY",
  },
  inLanguage: "ja",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-dvh flex flex-col bg-[#0a1628] text-slate-200 overflow-x-hidden">
        <div className="aurora-bg" />
        <SnowParticles />
        <MountainSilhouette />
        {children}
      </body>
    </html>
  );
}
