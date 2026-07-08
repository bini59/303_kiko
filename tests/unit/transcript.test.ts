import { describe, it, expect } from "vitest";
import { parseJson3 } from "@/lib/youtube/transcript";

describe("parseJson3", () => {
  it("parses json3 events into transcript entries", () => {
    const json = {
      events: [
        { tStartMs: 0, dDurationMs: 2500, segs: [{ utf8: "こんにちは" }] },
        { tStartMs: 2500, dDurationMs: 3000, segs: [{ utf8: "世界" }] },
      ],
    };

    expect(parseJson3(json)).toEqual([
      { text: "こんにちは", start: 0, duration: 2.5 },
      { text: "世界", start: 2.5, duration: 3 },
    ]);
  });

  it("joins multiple segs into one line", () => {
    const json = {
      events: [
        {
          tStartMs: 640,
          dDurationMs: 8760,
          segs: [{ utf8: "無敵" }, { utf8: "の" }, { utf8: "笑顔" }],
        },
      ],
    };

    expect(parseJson3(json)).toEqual([
      { text: "無敵の笑顔", start: 0.64, duration: 8.76 },
    ]);
  });

  it("filters out auto-caption rollup events (newline-only segs)", () => {
    const json = {
      events: [
        { tStartMs: 640, dDurationMs: 4350, segs: [{ utf8: "本編" }] },
        { tStartMs: 4990, dDurationMs: 10, segs: [{ utf8: "\n" }] },
        { tStartMs: 5000, dDurationMs: 4400, segs: [{ utf8: "続き" }] },
        { tStartMs: 9400, dDurationMs: 0 }, // no segs (window definition)
      ],
    };

    expect(parseJson3(json)).toEqual([
      { text: "本編", start: 0.64, duration: 4.35 },
      { text: "続き", start: 5, duration: 4.4 },
    ]);
  });

  it("returns empty array when there are no events", () => {
    expect(parseJson3({})).toEqual([]);
    expect(parseJson3({ events: [] })).toEqual([]);
  });
});
