import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import Script from "next/script";

import { BottomNav } from "@/components/bottom-nav";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "오늘의 루틴",
  description: "매일 함께 루틴을 완성해요",
  openGraph: {
    title: "오늘의 루틴",
    description: "매일 함께 루틴을 완성해요",
    images: [{ url: "/og.svg", width: 1200, height: 630 }],
  },
};

/** 모바일에서 input 포커스 시 자동 확대 완화 (iOS Safari 등) */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={cn("font-sans", geist.variable)}>
      <body className="flex min-h-full flex-col">
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          strategy="afterInteractive"
        />
        {children}
        <Suspense><BottomNav /></Suspense>
      </body>
    </html>
  );
}
