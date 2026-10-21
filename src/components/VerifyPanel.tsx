"use client";

import { useState } from "react";
import { TranscriptEntry } from "@/lib/youtube/types";
import { VerifyResult } from "@/lib/llm/types";
import { saveRecord } from "@/lib/history/storage";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";

export function VerifyPanel({ videoId, entry }: { videoId: string; entry: TranscriptEntry }) {
  const [translation, setTranslation] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    if (pending || !translation.trim()) return;
    setPending(true);
    setError("");
    setResult(null);
    const userTranslation = translation.trim();
    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ japanese: entry.text, userTranslation }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "검증에 실패했습니다");
      saveRecord({ videoId, entry: { ...entry }, userTranslation, result: data });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "검증에 실패했습니다");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="space-y-3">
      <h2 className="font-heading font-extrabold text-[16.5px]">번역 검증</h2>
      <p className="text-sm text-muted">자막을 클릭해 번역할 문장을 선택하세요.</p>
      <p>{entry.text}</p>
      <form onSubmit={verify} className="space-y-3">
        <label htmlFor="translation" className="block text-sm text-muted">내 번역</label>
        <textarea id="translation" value={translation} onChange={(e) => { setTranslation(e.target.value); setResult(null); }}
          disabled={pending} required rows={3}
          className="w-full rounded-2xl border border-line p-3 bg-card focus:ring-2 focus:ring-accent/40" />
        <Button type="submit" disabled={pending || !translation.trim()}>{pending ? "검증 중…" : "검증하기"}</Button>
      </form>
      {error && <p role="alert" className="text-accent">{error}</p>}
      {result && <div role="status" className="space-y-2 text-sm">
        <p className="font-bold">{result.isCorrect ? "정답" : "오답"} · {result.score}점</p>
        <p>추천 번역: {result.correctedTranslation}</p>
        <p className="text-muted">{result.explanation}</p>
      </div>}
    </Card>
  );
}
