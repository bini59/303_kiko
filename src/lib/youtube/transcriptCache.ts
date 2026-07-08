import { mkdirSync } from "fs";
import { dirname } from "path";
import { DatabaseSync } from "node:sqlite";
import { fetchTranscript } from "./transcript";
import { TranscriptEntry } from "./types";

// ponytail: 단일 프로세스 전제의 지연 초기화 싱글턴. 다중 인스턴스가 되면 외부 DB로.
let db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (db) return db;

  const path = process.env.TRANSCRIPT_DB_PATH ?? "./data/transcript-cache.db";
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }

  // 테이블 생성까지 성공한 뒤에만 싱글턴에 공개 — 부분 초기화된 핸들 방지
  const conn = new DatabaseSync(path);
  conn.exec(
    `CREATE TABLE IF NOT EXISTS transcripts (
      video_id TEXT NOT NULL,
      lang TEXT NOT NULL,
      entries TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (video_id, lang)
    )`
  );
  db = conn;
  return db;
}

// 캐시는 최적화일 뿐 — 읽기/쓰기 실패가 자막 파이프라인을 죽이면 안 된다.
function readCache(videoId: string, lang: string): TranscriptEntry[] | null {
  try {
    const row = getDb()
      .prepare(
        "SELECT entries FROM transcripts WHERE video_id = ? AND lang = ?"
      )
      .get(videoId, lang) as { entries: string } | undefined;
    return row ? (JSON.parse(row.entries) as TranscriptEntry[]) : null;
  } catch (error) {
    console.error("transcript cache read failed:", error);
    return null;
  }
}

function writeCache(
  videoId: string,
  lang: string,
  entries: TranscriptEntry[]
): void {
  try {
    getDb()
      .prepare(
        `INSERT OR REPLACE INTO transcripts (video_id, lang, entries, created_at)
         VALUES (?, ?, ?, ?)`
      )
      .run(videoId, lang, JSON.stringify(entries), Date.now());
  } catch (error) {
    console.error("transcript cache write failed:", error);
  }
}

/**
 * 캐시 우선 transcript 조회. miss일 때만 YouTube fetch(yt-dlp),
 * 성공한 결과만 저장한다(실패는 캐싱하지 않음 — 자막이 뒤늦게 올라오면 잡힘).
 */
export async function getTranscript(
  videoId: string,
  lang: string = "ja"
): Promise<TranscriptEntry[]> {
  const cached = readCache(videoId, lang);
  if (cached) return cached;

  // ponytail: 동일 videoId 동시 첫 요청은 둘 다 miss로 yt-dlp를 중복 호출한다.
  // 실트래픽에서 429가 다시 보이면 in-flight Map<videoId, Promise> coalescer 추가.
  const entries = await fetchTranscript(videoId, lang);
  writeCache(videoId, lang, entries);
  return entries;
}
