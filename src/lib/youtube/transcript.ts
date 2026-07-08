import { execFile } from "child_process";
import { promisify } from "util";
import { mkdtemp, readdir, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { TranscriptEntry } from "./types";

const execFileAsync = promisify(execFile);

// yt-dlp가 Innertube 변경을 따라가므로 직접 구현보다 안 깨진다.
const YTDLP = process.env.YTDLP_PATH || "yt-dlp";

const SRT_TIME =
  /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/;

/** SRT 블록을 TranscriptEntry[]로 파싱한다. */
export function parseSrt(srt: string): TranscriptEntry[] {
  const entries: TranscriptEntry[] = [];

  for (const block of srt.replace(/\r/g, "").trim().split(/\n\n+/)) {
    const lines = block.split("\n");
    const timeIdx = lines.findIndex((l) => l.includes("-->"));
    if (timeIdx === -1) continue;

    const m = lines[timeIdx].match(SRT_TIME);
    if (!m) continue;

    const start = +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000;
    const end = +m[5] * 3600 + +m[6] * 60 + +m[7] + +m[8] / 1000;

    const text = lines
      .slice(timeIdx + 1)
      .join(" ")
      .replace(/<[^>]+>/g, "") // vtt→srt 변환 시 남는 인라인 태그 제거
      .trim();
    if (!text) continue;

    entries.push({ text, start, duration: Math.max(0, end - start) });
  }

  return entries;
}

export async function fetchTranscript(
  videoId: string,
  lang: string = "ja"
): Promise<TranscriptEntry[]> {
  const dir = await mkdtemp(join(tmpdir(), "kiko-sub-"));

  try {
    await execFileAsync(
      YTDLP,
      [
        "--write-auto-subs",
        "--write-subs",
        "--sub-langs",
        `${lang}.*,${lang}`,
        "--skip-download",
        "--convert-subs",
        "srt",
        "--no-playlist",
        "-o",
        join(dir, "%(id)s.%(ext)s"),
        "--",
        `https://www.youtube.com/watch?v=${videoId}`,
      ],
      { timeout: 60_000, maxBuffer: 10 * 1024 * 1024 }
    );

    const srtFile = (await readdir(dir)).find((f) => f.endsWith(".srt"));
    if (!srtFile) throw new Error("이 영상에는 자막이 없습니다");

    const entries = parseSrt(await readFile(join(dir, srtFile), "utf-8"));
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
