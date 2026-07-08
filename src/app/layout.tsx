import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

// GA4 측정 ID. 공개 식별자라 기본값을 코드에 두고, 필요 시 NEXT_PUBLIC_GA_ID로 override.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-FCYK67GKZS";
// 개발 환경 데이터 오염을 막기 위해 프로덕션 빌드에서만 로드.
const GA_ENABLED = process.env.NODE_ENV === "production" && !!GA_ID;

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
      {GA_ENABLED ? <GoogleAnalytics gaId={GA_ID} /> : null}
    </html>
  );
}
