"use client";

import { useState } from "react";
import { Landing } from "@/components/Landing";
import { LearnView } from "@/components/LearnView";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { useTranscriptSync } from "@/hooks/useTranscriptSync";
import { VideoInfo, TranscriptEntry } from "@/lib/youtube/types";

export default function Home() {
  const [videoId, setVideoId] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transcriptError, setTranscriptError] = useState("");

  const { currentTime, duration, isPlaying, playerRef, seekTo, play, pause } =
    useYouTubePlayer(videoId);
  const activeIndex = useTranscriptSync(transcript, currentTime);

  const handleSubmit = async (id: string) => {
    setLoading(true);
    setError("");
    setTranscriptError("");
    setVideoInfo(null);
    setTranscript([]);

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

  const handleBack = () => {
    setVideoId("");
    setVideoInfo(null);
    setTranscript([]);
    setTranscriptError("");
    setError("");
  };

  if (!videoId) {
    return <Landing onSubmit={handleSubmit} loading={loading} error={error} />;
  }

  return (
    <LearnView
      videoInfo={videoInfo}
      transcript={transcript}
      activeIndex={activeIndex}
      currentTime={currentTime}
      duration={duration}
      isPlaying={isPlaying}
      playerRef={playerRef}
      onSeek={seekTo}
      onPlay={play}
      onPause={pause}
      onBack={handleBack}
      transcriptError={transcriptError}
    />
  );
}
