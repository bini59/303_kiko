"use client";

import { useState, useCallback, useRef, useEffect } from "react";

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface UseYouTubePlayerReturn {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playerRef: React.RefObject<HTMLDivElement | null>;
  seekTo: (time: number) => void;
  play: () => void;
  pause: () => void;
}

export function useYouTubePlayer(videoId: string): UseYouTubePlayerReturn {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<YT.Player | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!videoId || !playerRef.current) return;

    setCurrentTime(0);
    setDuration(0);

    const initPlayer = () => {
      if (!playerRef.current) return;

      ytPlayerRef.current = new window.YT.Player(playerRef.current, {
        videoId,
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            setDuration(ytPlayerRef.current?.getDuration() ?? 0);
          },
          onStateChange: (event: YT.OnStateChangeEvent) => {
            const playing = event.data === window.YT.PlayerState.PLAYING;
            setIsPlaying(playing);

            if (playing) {
              intervalRef.current = setInterval(() => {
                const time = ytPlayerRef.current?.getCurrentTime() ?? 0;
                setCurrentTime(time);
              }, 250);
            } else if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      ytPlayerRef.current?.destroy();
    };
  }, [videoId]);

  const seekTo = useCallback((time: number) => {
    try {
      ytPlayerRef.current?.seekTo(time, true);
    } catch {
      // Player may not be fully initialized yet
    }
    setCurrentTime(time);
  }, []);

  const play = useCallback(() => {
    ytPlayerRef.current?.playVideo();
  }, []);

  const pause = useCallback(() => {
    ytPlayerRef.current?.pauseVideo();
  }, []);

  return { currentTime, duration, isPlaying, playerRef, seekTo, play, pause };
}
