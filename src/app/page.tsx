"use client";

import { useState, useEffect } from "react";
import { YouTubeInput } from "@/components/YouTubeInput";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ScriptPanel } from "@/components/ScriptPanel";
import { VerifyPanel } from "@/components/VerifyPanel";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { useTranscriptSync } from "@/hooks/useTranscriptSync";
import { VideoInfo, TranscriptEntry } from "@/lib/youtube/types";

const API_KEY_STORAGE_KEY = "kiko_openai_api_key";

export default function Home() {
  const [videoId, setVideoId] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [selectedText, setSelectedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transcriptError, setTranscriptError] = useState("");
  const [apiKey, setApiKey] = useState("");

  const { currentTime, playerRef, seekTo } = useYouTubePlayer(videoId);
  const activeIndex = useTranscriptSync(transcript, currentTime);

  useEffect(() => {
    const saved = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (saved) setApiKey(saved);
  }, []);

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  };

  const handleSubmit = async (id: string) => {
    setLoading(true);
    setError("");
    setTranscriptError("");
    setVideoInfo(null);
    setTranscript([]);
    setSelectedText("");

    try {
      const response = await fetch(`/api/youtube?videoId=${id}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "영상 로드 실패");
      }

      const data = await response.json();
      setVideoId(id);
      setVideoInfo(data.info);
      setTranscript(data.transcript ?? []);
      if (data.transcriptError) {
        setTranscriptError(data.transcriptError);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };

  const handleClickEntry = (time: number) => {
    seekTo(time);
    const entry = transcript.find((e) => e.start === time);
    if (entry) {
      setSelectedText(entry.text);
    }
  };

  return (
    <main className="min-h-screen py-8 px-4 md:px-6">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        <header className="text-center">
          <h1 className="font-heading text-5xl md:text-6xl text-foreground font-extrabold -tracking-[0.02em]">
            Kiko
          </h1>
          <p className="font-body text-lg text-foreground/60 mt-2">
            유튜브로 배우는 일본어
          </p>
        </header>

        {/* Mobile: API key on top, full width */}
        {/* Desktop: API key + YouTube input side by side */}
        <section className="max-w-3xl mx-auto space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch">
            <div className="flex-1">
              <YouTubeInput onSubmit={handleSubmit} loading={loading} />
            </div>
            <div className="md:w-72 order-first md:order-last flex items-center">
              <div className="w-full">
                <ApiKeyInput apiKey={apiKey} onChange={handleApiKeyChange} />
              </div>
            </div>
          </div>
          {error && (
            <p className="font-body text-sm text-accent text-center">
              {error}
            </p>
          )}
        </section>

        {videoId && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <VideoPlayer playerRef={playerRef} title={videoInfo?.title} />
              <VerifyPanel selectedText={selectedText} apiKey={apiKey} />
            </div>
            <ScriptPanel
              transcript={transcript}
              activeIndex={activeIndex}
              onClickEntry={handleClickEntry}
              transcriptError={transcriptError}
            />
          </section>
        )}
      </div>
    </main>
  );
}
