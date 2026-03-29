import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
