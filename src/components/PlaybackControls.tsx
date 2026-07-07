"use client";

import { Pause, Play } from "lucide-react";

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
}

// ponytail: 로컬 포맷 헬퍼. util 신규 추출 안 함(ScriptPanel formatTime과 소량 중복 허용).
// duration=0(로드 직후) 시 음수/NaN 방지 가드.
export function formatRemaining(currentTime: number, duration: number): string {
  const remaining = Math.max(0, duration - currentTime);
  const m = Math.floor(remaining / 60);
  const s = Math.floor(remaining % 60);
  return `-${m}:${s.toString().padStart(2, "0")}`;
}

export function PlaybackControls({
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
}: PlaybackControlsProps) {
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="flex items-center gap-4 h-12 px-2">
      <button
        onClick={isPlaying ? onPause : onPlay}
        aria-label={isPlaying ? "일시정지" : "재생"}
        className="flex items-center justify-center w-11 h-11 rounded-full bg-foreground text-white hover:bg-accent transition-colors duration-100 shrink-0 cursor-pointer"
      >
        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
      </button>

      <div
        className="flex-1 h-1.5 rounded-full bg-chip overflow-hidden"
        role="progressbar"
        aria-label="재생 진행률"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <div
          className="h-full bg-accent transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <span className="font-body text-[12.5px] tabular-nums text-muted shrink-0">
        {formatRemaining(currentTime, duration)}
      </span>
    </div>
  );
}
