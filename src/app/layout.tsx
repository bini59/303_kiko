import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kiko - 일본어 학습 플랫폼",
  description: "유튜브 영상 기반 일본어 학습 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
