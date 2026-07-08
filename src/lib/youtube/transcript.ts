import { execFile } from "child_process";
import { promisify } from "util";
import { mkdtemp, readdir, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { TranscriptEntry } from "./types";

const execFileAsync = promisify(execFile);

// yt-dlp가 Innertube 변경을 따라가므로 직접 구현보다 안 깨진다.
const YTDLP = process.env.YTDLP_PATH || "yt-dlp";
// 설정 시 자막 요청만 이 프록시(gluetun VPN)를 경유한다. YouTube의 클라우드 IP 봇 차단 우회.
const YTDLP_PROXY = process.env.YTDLP_PROXY;

interface Json3Event {
  segs?: { utf8: string }[];
  tStartMs: number;
  dDurationMs?: number;
}

/**
 * YouTube json3 자막을 TranscriptEntry[]로 파싱한다.
 * 자동 자막의 롤업 이벤트는 seg가 개행("\n")뿐이라 trim 후 빈 문자열로 걸러진다.
 */
export function parseJson3(json: { events?: Json3Event[] }): TranscriptEntry[] {
  return (json.events ?? [])
    .filter((e) => e.segs && e.segs.length > 0)
    .map((e) => ({
      text: e.segs!.map((s) => s.utf8).join("").trim(),
      start: e.tStartMs / 1000,
      duration: (e.dDurationMs ?? 0) / 1000,
    }))
    .filter((e) => e.text.length > 0);
}

export async function fetchTranscript(
  videoId: string,
  lang: string = "ja"
): Promise<TranscriptEntry[]> {
  const dir = await mkdtemp(join(tmpdir(), "kiko-sub-"));

  try {
    const args = [
      "--write-auto-subs",
      "--write-subs",
      // 원본 언어 트랙만. `${lang}.*` 와일드카드는 자동번역 트랙(ja-zh 등)까지
      // 긁어 불필요한 요청이 늘고 YouTube 429(rate limit)를 앞당긴다.
      "--sub-langs",
      `${lang},${lang}-orig`,
      "--sub-format",
      "json3",
      "--skip-download",
      "--no-playlist",
      "--retries",
      "5",
      "--extractor-retries",
      "3",
      "-o",
      join(dir, "%(id)s.%(ext)s"),
    ];
    if (YTDLP_PROXY) args.push("--proxy", YTDLP_PROXY);
    args.push("--", `https://www.youtube.com/watch?v=${videoId}`);

    await execFileAsync(YTDLP, args, {
      timeout: 60_000,
      maxBuffer: 10 * 1024 * 1024,
    });

    const files = await readdir(dir);
    // 원본 언어 트랙(<lang>) 우선, 없으면 <lang>-orig 등, 없으면 아무 json3
    const pick =
      files.find((f) => f.endsWith(`.${lang}.json3`)) ??
      files.find((f) => f.includes(`.${lang}`) && f.endsWith(".json3")) ??
      files.find((f) => f.endsWith(".json3"));
    if (!pick) throw new Error("이 영상에는 자막이 없습니다");

    const json = JSON.parse(await readFile(join(dir, pick), "utf-8"));
    const entries = parseJson3(json);
    if (entries.length === 0) throw new Error("이 영상에는 자막이 없습니다");

    return entries;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error("yt-dlp가 설치되어 있지 않습니다");
    }
    throw error instanceof Error
      ? error
      : new Error("자막을 불러올 수 없습니다");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
