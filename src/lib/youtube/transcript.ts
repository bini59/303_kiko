import { TranscriptEntry } from "./types";

const INNERTUBE_URL =
  "https://www.youtube.com/youtubei/v1/player?pretend=true";

const INNERTUBE_CONTEXT = {
  client: {
    clientName: "ANDROID",
    clientVersion: "19.09.37",
    androidSdkVersion: 30,
    hl: "ja",
    gl: "JP",
  },
};

interface Json3Event {
  segs?: { utf8: string }[];
  tStartMs: number;
  dDurationMs?: number;
}

export async function fetchTranscript(
  videoId: string,
  lang: string = "ja"
): Promise<TranscriptEntry[]> {
  // Step 1: Get caption tracks from Innertube player API
  const playerRes = await fetch(INNERTUBE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      context: INNERTUBE_CONTEXT,
      videoId,
    }),
  });

  if (!playerRes.ok) {
    throw new Error(`Innertube player API 실패: ${playerRes.status}`);
  }

  const playerData = await playerRes.json();

  const captionTracks: { baseUrl: string; languageCode: string; kind?: string }[] =
    playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

  if (captionTracks.length === 0) {
    throw new Error("자막 트랙을 찾을 수 없습니다");
  }

  // Prefer manual lang track > lang auto (asr) track > first track
  const track =
    captionTracks.find((t) => t.languageCode === lang && t.kind !== "asr") ??
    captionTracks.find((t) => t.languageCode === lang) ??
    captionTracks[0];

  // Step 2: Fetch transcript in json3 format
  const transcriptUrl = `${track.baseUrl}&fmt=json3`;
  const transcriptRes = await fetch(transcriptUrl);

  if (!transcriptRes.ok) {
    throw new Error(`자막 데이터 요청 실패: ${transcriptRes.status}`);
  }

  const json3 = await transcriptRes.json();

  const events: Json3Event[] = json3?.events ?? [];

  // Parse json3 events into TranscriptEntry[]
  const entries: TranscriptEntry[] = events
    .filter((e) => e.segs && e.segs.length > 0)
    .map((e) => ({
      text: e.segs!.map((s) => s.utf8).join("").trim(),
      start: e.tStartMs / 1000,
      duration: (e.dDurationMs ?? 0) / 1000,
    }))
    .filter((e) => e.text.length > 0);

  if (entries.length === 0) {
    throw new Error("이 영상에는 자막이 없습니다");
  }

  return entries;
}
