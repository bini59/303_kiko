import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/youtube/transcript", () => ({
  fetchTranscript: vi.fn(),
}));

import { TranscriptCache, getTranscript } from "@/lib/youtube/transcript-cache";
import { fetchTranscript } from "@/lib/youtube/transcript";

const mockFetch = vi.mocked(fetchTranscript);
const entries = [{ text: "こんにちは", start: 0, duration: 2 }];

describe("getTranscript", () => {
  let cache: TranscriptCache;
  const useCache = () => cache;

  beforeEach(() => {
    vi.clearAllMocks();
    cache = new TranscriptCache(":memory:");
  });

  it("fetches from YouTube on miss and serves later requests from cache", async () => {
    mockFetch.mockResolvedValueOnce(entries);

    expect(await getTranscript("vid1", "ja", useCache)).toEqual(entries);
    expect(await getTranscript("vid1", "ja", useCache)).toEqual(entries);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(cache.get("vid1")).toEqual(entries);
  });

  it("does not cache failed extractions", async () => {
    mockFetch.mockRejectedValueOnce(new Error("이 영상에는 자막이 없습니다"));

    await expect(getTranscript("vid2", "ja", useCache)).rejects.toThrow(
      "이 영상에는 자막이 없습니다"
    );
    expect(cache.get("vid2")).toBeNull();
  });

  it("still returns the transcript when the cache is broken", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetch.mockResolvedValueOnce(entries);
    const broken = () => {
      throw new Error("disk full");
    };

    expect(await getTranscript("vid3", "ja", broken)).toEqual(entries);
  });
});
