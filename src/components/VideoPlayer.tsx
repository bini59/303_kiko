"use client";

import { Card } from "./ui/Card";

interface VideoPlayerProps {
  playerRef: React.RefObject<HTMLDivElement | null>;
  title?: string;
}

export function VideoPlayer({ playerRef, title }: VideoPlayerProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div ref={playerRef as React.LegacyRef<HTMLDivElement>} className="aspect-video w-full" />
      {title && (
        <div className="p-4">
          <h2 className="font-heading text-xl font-extrabold -tracking-[0.01em] text-foreground truncate">
            {title}
          </h2>
        </div>
      )}
    </Card>
  );
}
