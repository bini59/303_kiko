"use client";

import { ArrowLeft } from "lucide-react";
import { Card } from "./ui/Card";
import { VideoPlayer } from "./VideoPlayer";
import { ScriptPanel } from "./ScriptPanel";
import { PlaybackControls } from "./PlaybackControls";
import { VideoInfo, TranscriptEntry } from "@/lib/youtube/types";

interface LearnViewProps {
  videoInfo: VideoInfo | null;
  transcript: TranscriptEntry[];
  activeIndex: number;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playerRef: React.RefObject<HTMLDivElement | null>;
  onSeek: (time: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onBack: () => void;
  transcriptError?: string;
}

export function LearnView({
  videoInfo,
  transcript,
  activeIndex,
  currentTime,
  duration,
  isPlaying,
  playerRef,
  onSeek,
  onPlay,
  onPause,
  onBack,
  transcriptError,
}: LearnViewProps) {
  return (
    <main className="min-h-screen flex flex-col md:flex-row gap-4 p-4 md:p-6">
      {/* 좌 사이드바: 플레이어 + 영상 정보. */}
      {/* ponytail: native resize:horizontal — 커스텀 드래그 핸들 스킵. iOS Safari 미지원이나 모바일은 스택이라 무관. */}
      <aside className="w-full md:w-80 md:min-w-64 md:max-w-[40vw] md:resize-x md:overflow-auto shrink-0 space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 font-body text-sm text-muted hover:text-foreground transition-colors duration-100 cursor-pointer"
        >
          <ArrowLeft size={16} /> 뒤로
        </button>

        <VideoPlayer playerRef={playerRef} />

        {videoInfo && (
          <Card>
            <h1 className="font-heading text-[16.5px] font-extrabold -tracking-[0.01em] text-foreground">
              {videoInfo.title}
            </h1>
            <p className="font-body text-[13px] text-faint mt-1">
              {videoInfo.channelTitle}
            </p>
          </Card>
        )}
      </aside>

      {/* 중앙 메인: 자막(클릭=seek) + 재생 컨트롤. */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <div className="flex-1 min-h-0">
          <ScriptPanel
            transcript={transcript}
            activeIndex={activeIndex}
            onClickEntry={onSeek}
            transcriptError={transcriptError}
          />
        </div>
        <div className="bg-card border border-line rounded-[18px] shadow-card px-4 py-2">
          <PlaybackControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onPlay={onPlay}
            onPause={onPause}
          />
        </div>
      </div>
    </main>
  );
}
