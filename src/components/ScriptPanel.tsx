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
    <Card className="h-full overflow-y-auto">
      <h3 className="font-extrabold -tracking-[0.01em] text-lg text-foreground mb-3 sticky top-0 bg-card py-2">
        스크립트
      </h3>
      {transcriptError ? (
        <div
          className="font-body text-muted text-center py-10 px-4"
          role="status"
        >
          <p className="text-accent font-bold mb-1">{transcriptError}</p>
          <p className="text-sm">
            다시 시도하거나 자막이 있는 다른 영상을 골라주세요.
          </p>
        </div>
      ) : (
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
      )}
    </Card>
  );
}
