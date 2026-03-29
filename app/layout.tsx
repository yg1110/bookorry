import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bookorry",
  description: "Bookorry is a platform for booking books",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
