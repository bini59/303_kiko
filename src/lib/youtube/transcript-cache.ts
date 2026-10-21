import { mkdirSync } from "fs";
import { dirname } from "path";
import type { DatabaseSync } from "node:sqlite";
import { fetchTranscript } from "./transcript";
import { TranscriptEntry } from "./types";

/**
 * 추출에 성공한 Transcript를 SQLite에 videoId 키로 저장한다.
 * 같은 영상을 다시 열 때 YouTube(yt-dlp) 요청을 건너뛰어 429/차단 위험을 줄인다.
 * 실패한 추출은 저장하지 않고(negative cache 없음), 무효화 정책도 없다.
 */
export class TranscriptCache {
  private db: DatabaseSync;

  constructor(path: string) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    // node:sqlite는 Node 22+ 내장 모듈. webpack이 번들링하지 않도록 런타임에 로드한다.
    const { DatabaseSync } = process.getBuiltinModule(
      "node:sqlite"
    ) as typeof import("node:sqlite");
    this.db = new DatabaseSync(path);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transcripts (
        video_id   TEXT PRIMARY KEY,
        lang       TEXT NOT NULL,
        entries    TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }

  get(videoId: string): TranscriptEntry[] | null {
    const row = this.db
      .prepare("SELECT entries FROM transcripts WHERE video_id = ?")
      .get(videoId) as { entries: string } | undefined;
    return row ? (JSON.parse(row.entries) as TranscriptEntry[]) : null;
  }

  set(videoId: string, lang: string, entries: TranscriptEntry[]): void {
    this.db
      .prepare(
        "INSERT OR REPLACE INTO transcripts (video_id, lang, entries) VALUES (?, ?, ?)"
      )
      .run(videoId, lang, JSON.stringify(entries));
  }
}

let shared: TranscriptCache | null = null;

function sharedCache(): TranscriptCache {
  shared ??= new TranscriptCache(
    process.env.TRANSCRIPT_CACHE_PATH || "data/kiko.db"
  );
  return shared;
}

/**
 * 캐시 우선으로 Transcript를 가져온다. miss일 때만 YouTube에서 추출하고, 성공하면 저장한다.
 * 캐시 자체가 고장나도 자막 기능은 동작하도록 캐시 오류는 로그만 남긴다.
 */
export async function getTranscript(
  videoId: string,
  lang: string = "ja",
  cache: () => TranscriptCache = sharedCache
): Promise<TranscriptEntry[]> {
  try {
    const hit = cache().get(videoId);
    if (hit) return hit;
  } catch (error) {
    console.error("transcript cache read failed", error);
  }

  const entries = await fetchTranscript(videoId, lang);

  try {
    cache().set(videoId, lang, entries);
  } catch (error) {
    console.error("transcript cache write failed", error);
  }
  return entries;
}
