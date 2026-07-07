import type { Config } from "tailwindcss";

const PRETENDARD = [
  '"Pretendard Variable"',
  "Pretendard",
  "-apple-system",
  "BlinkMacSystemFont",
  '"Apple SD Gothic Neo"',
  "sans-serif",
];

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f4f5f7", // 앱 캔버스 (뉴트럴 그레이)
        foreground: "#17181c", // 기본 텍스트 (ink)
        card: "#ffffff", // 카드/입력 surface
        muted: "#6b7280", // 보조 본문 텍스트
        faint: "#9aa0aa", // 메타/라벨 (가장 옅음)
        line: "#ecedf0", // 1px 보더
        chip: "#f1f3f6", // 칩/뱃지 배경
        accent: "#3e5bff", // 파란 accent
      },
      fontFamily: {
        heading: PRETENDARD,
        body: PRETENDARD,
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(20,22,30,0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
