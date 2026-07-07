"use client";

import { useEffect, useRef } from "react";
import { Card } from "./ui/Card";
import { TranscriptEntry } from "@/lib/youtube/types";

interface ScriptPanelProps {
  transcript: TranscriptEntry[];
  activeIndex: number;
  onClickEntry: (time: number) => void;
  transcriptError?: string;
}

export function ScriptPanel({
  transcript,
  activeIndex,
  onClickEntry,
  transcriptError,
}: ScriptPanelProps) {
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeIndex]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="h-[500px] overflow-y-auto">
      <h3 className="font-extrabold -tracking-[0.01em] text-lg text-foreground mb-3 sticky top-0 bg-card py-2">
        스크립트
      </h3>
      {transcriptError && (
        <p className="font-body text-sm text-accent mb-3" role="alert">
          자막을 불러올 수 없습니다
        </p>
      )}
      <div className="space-y-1">
        {transcript.map((entry, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={`${entry.start}-${index}`}
              ref={isActive ? activeRef : null}
              onClick={() => onClickEntry(entry.start)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors font-body text-base cursor-pointer ${
                isActive
                  ? "bg-accent/10 border-l-2 border-accent text-accent"
                  : "hover:bg-chip text-muted"
              }`}
            >
              <span className="text-xs text-muted mr-2 font-body">
                {formatTime(entry.start)}
              </span>
              {entry.text}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
