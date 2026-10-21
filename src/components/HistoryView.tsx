"use client";

import { ArrowLeft } from "lucide-react";
import { Card } from "./ui/Card";
import { StudyRecord, sortForReview } from "@/lib/history/storage";

interface HistoryViewProps {
  records: StudyRecord[];
  onBack: () => void;
}

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export function HistoryView({ records, onBack }: HistoryViewProps) {
  const sorted = sortForReview(records);
  const wrongCount = records.filter((r) => !r.result.isCorrect).length;

  return (
    <main className="min-h-screen px-4 py-6 md:px-6">
      <div className="max-w-[640px] mx-auto space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 font-body text-sm text-muted hover:text-foreground transition-colors duration-100 cursor-pointer"
        >
          <ArrowLeft size={16} /> 뒤로
        </button>

        <div>
          <h1 className="font-heading text-2xl font-extrabold -tracking-[0.02em] text-foreground">
            학습 기록
          </h1>
          <p className="font-body text-[13px] text-faint mt-1">
            {records.length}문장 검증 · 오답 {wrongCount}개
          </p>
        </div>

        {sorted.length === 0 ? (
          <Card>
            <p className="font-body text-muted text-center py-6" role="status">
              아직 검증한 문장이 없습니다. 자막 문장을 번역하고 검증해보세요.
            </p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {sorted.map((record) => (
              <li key={record.id}>
                <Card className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`font-body text-xs font-bold px-2 py-0.5 rounded-full ${
                        record.result.isCorrect
                          ? "bg-chip text-muted"
                          : "bg-accent/10 text-accent"
                      }`}
                    >
                      {record.result.isCorrect ? "정답" : "오답"} ·{" "}
                      {record.result.score}점
                    </span>
                    <span className="font-body text-xs text-faint">
                      {formatTime(record.entry.start)} ·{" "}
                      {new Date(record.verifiedAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <p className="font-body text-base text-foreground">
                    {record.entry.text}
                  </p>
                  <p className="font-body text-sm text-muted">
                    내 번역: {record.userTranslation}
                  </p>
                  {!record.result.isCorrect && (
                    <p className="font-body text-sm text-accent">
                      추천 번역: {record.result.correctedTranslation}
                    </p>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
