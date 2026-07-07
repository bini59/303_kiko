"use client";

import { useState, FormEvent } from "react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { VerifyResult } from "@/lib/llm/types";

interface VerifyPanelProps {
  selectedText: string;
  apiKey: string;
}

export function VerifyPanel({ selectedText, apiKey }: VerifyPanelProps) {
  const [translation, setTranslation] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedText || !translation) return;

    if (!apiKey) {
      setError("OpenAI API Key를 먼저 입력해주세요");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          japanese: selectedText,
          userTranslation: translation,
          apiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "검증 요청 실패");
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-accent";
  };

  return (
    <Card>
      <h3 className="font-extrabold -tracking-[0.01em] text-lg text-foreground mb-3">번역 검증</h3>

      {selectedText ? (
        <>
          <div className="mb-3 p-3 bg-chip rounded-lg">
            <p className="font-body text-sm text-muted">선택된 문장</p>
            <p className="font-body text-base text-foreground">{selectedText}</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-3">
            <Input
              placeholder="한국어 번역을 입력하세요"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
            />
            <Button type="submit" disabled={loading || !translation}>
              {loading ? "검증 중..." : "번역 검증"}
            </Button>
          </form>

          {error && (
            <p className="mt-3 font-body text-sm text-accent">{error}</p>
          )}

          {result && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-heading text-lg">점수:</span>
                <span
                  className={`font-heading text-2xl ${getScoreColor(result.score)}`}
                >
                  {result.score}점
                </span>
              </div>
              {!result.isCorrect && (
                <div className="p-3 bg-accent/5 rounded-lg">
                  <p className="font-body text-sm text-muted">
                    추천 번역
                  </p>
                  <p className="font-body text-base text-accent">
                    {result.correctedTranslation}
                  </p>
                </div>
              )}
              <p className="font-body text-sm text-foreground/80">
                {result.explanation}
              </p>
            </div>
          )}
        </>
      ) : (
        <p className="font-body text-foreground/50">
          스크립트에서 문장을 클릭하면 번역을 검증할 수 있습니다
        </p>
      )}
    </Card>
  );
}
