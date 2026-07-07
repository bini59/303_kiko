"use client";

import { AlignLeft, Languages, MousePointerClick } from "lucide-react";
import { Card } from "./ui/Card";
import { YouTubeInput } from "./YouTubeInput";

interface LandingProps {
  onSubmit: (videoId: string) => void;
  loading?: boolean;
  error?: string;
}

// ponytail: 정적 콘텐츠 배열. features용 CMS/config 추상화 금지.
const FEATURES = [
  {
    icon: AlignLeft,
    title: "자막 한 줄씩, 흐름 그대로",
    body: "영상 재생에 맞춰 현재 자막 줄이 자동으로 하이라이트됩니다. 놓친 문장은 클릭 한 번으로 그 지점부터 다시 재생하세요.",
  },
  {
    icon: MousePointerClick,
    title: "클릭하면 그 순간으로",
    body: "듣고 싶은 문장을 고르면 영상이 정확히 그 타임스탬프로 이동합니다. 받아쓰기도, 반복 청취도 마찰 없이.",
  },
  {
    icon: Languages,
    title: "번역으로 이해를 검증",
    body: "귀로 들은 내용을 스스로 번역해보고 확인하는 능동적 학습. 수동적인 자막 읽기에서 벗어나세요.",
  },
];

export function Landing({ onSubmit, loading, error }: LandingProps) {
  return (
    <main>
      {/* 히어로 — above the fold */}
      <section className="min-h-[100svh] flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-[560px] text-center">
          <h1 className="font-heading text-6xl md:text-7xl text-foreground font-extrabold -tracking-[0.03em]">
            Kiko
          </h1>
          <p className="font-body text-lg md:text-xl text-muted mt-3">
            유튜브 영상으로 배우는 일본어
          </p>

          <div className="mt-10 text-left">
            <YouTubeInput onSubmit={onSubmit} loading={loading} />
            {error && (
              <p className="font-body text-sm text-accent mt-2" role="alert">
                {error}
              </p>
            )}
          </div>

          <p className="font-body text-[13px] text-faint mt-16 animate-pulse">
            아래로 스크롤해 더 알아보기 ↓
          </p>
        </div>
      </section>

      {/* SaaS형 사용사례 — 스크롤 스토리 */}
      <section className="px-5 pb-24">
        <div className="max-w-[560px] mx-auto space-y-4">
          <h2 className="font-heading text-2xl md:text-3xl font-extrabold -tracking-[0.02em] text-foreground text-center mb-8">
            듣고, 고르고, 이해한다
          </h2>
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <Card key={title}>
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-accent/10 text-accent mb-4">
                <Icon size={22} strokeWidth={2} />
              </div>
              <h3 className="font-heading text-[16.5px] font-extrabold -tracking-[0.01em] text-foreground">
                {title}
              </h3>
              <p className="font-body text-[15px] text-muted leading-[1.6] mt-2">
                {body}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
