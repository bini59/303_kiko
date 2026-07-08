import { describe, it, expect } from "vitest";
import { parseSrt } from "@/lib/youtube/transcript";

describe("parseSrt", () => {
  it("parses SRT blocks into transcript entries", () => {
    const srt = [
      "1",
      "00:00:00,000 --> 00:00:02,500",
      "こんにちは",
      "",
      "2",
      "00:00:02,500 --> 00:00:05,500",
      "世界",
      "",
    ].join("\n");

    expect(parseSrt(srt)).toEqual([
      { text: "こんにちは", start: 0, duration: 2.5 },
      { text: "世界", start: 2.5, duration: 3 },
    ]);
  });

  it("joins multi-line cue text and strips inline tags", () => {
    const srt = [
      "1",
      "00:00:01,000 --> 00:00:03,000",
      "<c>有効</c>な",
      "テスト",
      "",
    ].join("\n");

    expect(parseSrt(srt)).toEqual([
      { text: "有効な テスト", start: 1, duration: 2 },
    ]);
  });

  it("skips blocks with no text or no timestamp", () => {
    const srt = [
      "1",
      "00:00:00,000 --> 00:00:01,000",
      "テスト",
      "",
      "2",
      "00:00:01,000 --> 00:00:02,000",
      "   ",
      "",
      "NOTE this has no timestamp",
      "",
    ].join("\n");

    expect(parseSrt(srt)).toEqual([
      { text: "テスト", start: 0, duration: 1 },
    ]);
  });

  it("returns empty array for empty input", () => {
    expect(parseSrt("")).toEqual([]);
  });
});
