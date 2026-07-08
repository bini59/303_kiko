import { NextRequest, NextResponse } from "next/server";
import { fetchVideoInfo } from "@/lib/youtube/client";
import { getTranscript } from "@/lib/youtube/transcriptCache";

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json(
      { error: "videoId 파라미터가 필요합니다" },
      { status: 400 }
    );
  }

  try {
    const [infoResult, transcriptResult] = await Promise.allSettled([
      fetchVideoInfo(videoId),
      getTranscript(videoId),
    ]);

    if (infoResult.status === "rejected") {
      const message =
        infoResult.reason instanceof Error
          ? infoResult.reason.message
          : "알 수 없는 오류";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const transcript =
      transcriptResult.status === "fulfilled" ? transcriptResult.value : [];
    const transcriptError =
      transcriptResult.status === "rejected"
        ? transcriptResult.reason instanceof Error
          ? transcriptResult.reason.message
          : "자막을 불러올 수 없습니다"
        : null;

    return NextResponse.json({
      info: infoResult.value,
      transcript,
      transcriptError,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
