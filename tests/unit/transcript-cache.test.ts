import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTranscript } from "@/lib/youtube/transcriptCache";
import { fetchTranscript } from "@/lib/youtube/transcript";
import { TranscriptEntry } from "@/lib/youtube/types";

vi.mock("@/lib/youtube/transcript", () => ({
  fetchTranscript: vi.fn(),
}));

const mockFetch = vi.mocked(fetchTranscript);

const entries: TranscriptEntry[] = [
  { text: "こんにちは", start: 0, duration: 2.5 },
  { text: "世界", start: 2.5, duration: 3 },
];

describe("getTranscript", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("cache miss: fetches from YouTube and stores the result", async () => {
    mockFetch.mockResolvedValueOnce(entries);

    const result = await getTranscript("miss-video");

    expect(result).toEqual(entries);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith("miss-video", "ja");
  });

  it("cache hit: returns stored transcript without fetching", async () => {
    mockFetch.mockResolvedValueOnce(entries);
    await getTranscript("hit-video");
    mockFetch.mockClear();

    const result = await getTranscript("hit-video");

    expect(result).toEqual(entries);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetch failure: propagates the error and caches nothing", async () => {
    mockFetch.mockRejectedValueOnce(new Error("이 영상에는 자막이 없습니다"));

    await expect(getTranscript("fail-video")).rejects.toThrow(
      "이 영상에는 자막이 없습니다"
    );

    // 실패는 캐싱되지 않음 — 재요청 시 다시 fetch한다
    mockFetch.mockResolvedValueOnce(entries);
    const retry = await getTranscript("fail-video");
    expect(retry).toEqual(entries);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
