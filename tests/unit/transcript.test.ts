import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchTranscript } from "@/lib/youtube/transcript";

function mockFetchResponses(
  ...responses: Array<{ ok: boolean; status?: number; json?: unknown }>
) {
  const fetchMock = vi.fn();
  for (const res of responses) {
    fetchMock.mockResolvedValueOnce({
      ok: res.ok,
      status: res.status ?? (res.ok ? 200 : 500),
      json: async () => res.json,
    });
  }
  global.fetch = fetchMock;
  return fetchMock;
}

describe("fetchTranscript", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("parses transcript entries from Innertube json3 response", async () => {
    const playerJson = {
      captions: {
        playerCaptionsTracklistRenderer: {
          captionTracks: [
            { baseUrl: "https://example.com/timedtext", languageCode: "ja" },
          ],
        },
      },
    };
    const json3 = {
      events: [
        {
          tStartMs: 0,
          dDurationMs: 2500,
          segs: [{ utf8: "こんにちは" }],
        },
        {
          tStartMs: 2500,
          dDurationMs: 3000,
          segs: [{ utf8: "世界" }],
        },
      ],
    };

    mockFetchResponses(
      { ok: true, json: playerJson },
      { ok: true, json: json3 }
    );

    const result = await fetchTranscript("testVideoId", "ja");

    expect(result).toEqual([
      { text: "こんにちは", start: 0, duration: 2.5 },
      { text: "世界", start: 2.5, duration: 3 },
    ]);
  });

  it("throws error when no caption tracks are found", async () => {
    const playerJson = {
      captions: {
        playerCaptionsTracklistRenderer: {
          captionTracks: [],
        },
      },
    };

    mockFetchResponses({ ok: true, json: playerJson });

    await expect(fetchTranscript("testVideoId", "ja")).rejects.toThrow(
      "자막 트랙을 찾을 수 없습니다"
    );
  });

  it("throws error when Innertube player API fails", async () => {
    mockFetchResponses({ ok: false, status: 403 });

    await expect(fetchTranscript("testVideoId", "ja")).rejects.toThrow(
      "Innertube player API 실패: 403"
    );
  });

  it("filters out empty segments", async () => {
    const playerJson = {
      captions: {
        playerCaptionsTracklistRenderer: {
          captionTracks: [
            { baseUrl: "https://example.com/timedtext", languageCode: "ja" },
          ],
        },
      },
    };
    const json3 = {
      events: [
        {
          tStartMs: 0,
          dDurationMs: 1000,
          segs: [{ utf8: "テスト" }],
        },
        {
          tStartMs: 1000,
          dDurationMs: 500,
          segs: [{ utf8: "  " }],
        },
        {
          tStartMs: 1500,
          dDurationMs: 0,
        },
        {
          tStartMs: 2000,
          dDurationMs: 2000,
          segs: [{ utf8: "有効" }],
        },
      ],
    };

    mockFetchResponses(
      { ok: true, json: playerJson },
      { ok: true, json: json3 }
    );

    const result = await fetchTranscript("testVideoId", "ja");

    expect(result).toEqual([
      { text: "テスト", start: 0, duration: 1 },
      { text: "有効", start: 2, duration: 2 },
    ]);
  });

  it("falls back to first track when requested language is not found", async () => {
    const playerJson = {
      captions: {
        playerCaptionsTracklistRenderer: {
          captionTracks: [
            { baseUrl: "https://example.com/timedtext", languageCode: "en" },
          ],
        },
      },
    };
    const json3 = {
      events: [
        {
          tStartMs: 0,
          dDurationMs: 2000,
          segs: [{ utf8: "Hello" }],
        },
      ],
    };

    mockFetchResponses(
      { ok: true, json: playerJson },
      { ok: true, json: json3 }
    );

    const result = await fetchTranscript("testVideoId", "ja");

    expect(result).toEqual([{ text: "Hello", start: 0, duration: 2 }]);
  });

  it("handles missing captions field gracefully", async () => {
    const playerJson = { videoDetails: { videoId: "test" } };

    mockFetchResponses({ ok: true, json: playerJson });

    await expect(fetchTranscript("testVideoId", "ja")).rejects.toThrow(
      "자막 트랙을 찾을 수 없습니다"
    );
  });

  it("prefers manual ja track over ja asr track", async () => {
    const playerJson = {
      captions: {
        playerCaptionsTracklistRenderer: {
          captionTracks: [
            { baseUrl: "https://example.com/asr", languageCode: "ja", kind: "asr" },
            { baseUrl: "https://example.com/manual", languageCode: "ja" },
          ],
        },
      },
    };
    const json3 = {
      events: [{ tStartMs: 0, dDurationMs: 1000, segs: [{ utf8: "手動" }] }],
    };

    const fetchMock = mockFetchResponses(
      { ok: true, json: playerJson },
      { ok: true, json: json3 }
    );

    await fetchTranscript("testVideoId", "ja");

    expect(fetchMock.mock.calls[1][0]).toContain("https://example.com/manual");
  });

  it("uses ja asr track when no manual ja track exists", async () => {
    const playerJson = {
      captions: {
        playerCaptionsTracklistRenderer: {
          captionTracks: [
            { baseUrl: "https://example.com/en", languageCode: "en" },
            { baseUrl: "https://example.com/asr", languageCode: "ja", kind: "asr" },
          ],
        },
      },
    };
    const json3 = {
      events: [{ tStartMs: 0, dDurationMs: 1000, segs: [{ utf8: "自動" }] }],
    };

    const fetchMock = mockFetchResponses(
      { ok: true, json: playerJson },
      { ok: true, json: json3 }
    );

    await fetchTranscript("testVideoId", "ja");

    expect(fetchMock.mock.calls[1][0]).toContain("https://example.com/asr");
  });

  it("throws when transcript parses to zero entries", async () => {
    const playerJson = {
      captions: {
        playerCaptionsTracklistRenderer: {
          captionTracks: [
            { baseUrl: "https://example.com/timedtext", languageCode: "ja" },
          ],
        },
      },
    };
    const json3 = {
      events: [
        { tStartMs: 0, dDurationMs: 500, segs: [{ utf8: "  " }] },
        { tStartMs: 500, dDurationMs: 500 },
      ],
    };

    mockFetchResponses(
      { ok: true, json: playerJson },
      { ok: true, json: json3 }
    );

    await expect(fetchTranscript("testVideoId", "ja")).rejects.toThrow(
      "이 영상에는 자막이 없습니다"
    );
  });
});
