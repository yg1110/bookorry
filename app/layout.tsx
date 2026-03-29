import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";

import { BottomNav } from "@/components/bottom-nav";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Bookorry",
  description: "Bookorry is a platform for booking books",
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
          {children}
          <BottomNav />
        </body>
    </html>
  );
}
