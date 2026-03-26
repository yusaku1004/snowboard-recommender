import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SnowParticles } from "@/components/ui/SnowParticles";
import { MountainSilhouette } from "@/components/ui/MountainSilhouette";
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
  title: "スノーボード診断 - あなたにぴったりの板を見つけよう",
  description:
    "スタイルや体格に合わせて、最適なスノーボードとサイズをAIがレコメンド。",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "スノーボード診断 - あなたにぴったりの板を見つけよう",
    description:
      "スタイルや体格に合わせて、最適なスノーボードとサイズをAIがレコメンド。",
    images: ["/og-image.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "スノーボード診断 - あなたにぴったりの板を見つけよう",
    description:
      "スタイルや体格に合わせて、最適なスノーボードとサイズをAIがレコメンド。",
    images: ["/og-image.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0a1628] text-slate-200">
        <div className="aurora-bg" />
        <SnowParticles />
        <MountainSilhouette />
        {children}
      </body>
    </html>
  );
}
