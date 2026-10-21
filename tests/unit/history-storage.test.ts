import { describe, it, expect, beforeEach } from "vitest";
import {
  HISTORY_STORAGE_KEY,
  loadHistory,
  saveRecord,
  sortForReview,
  NewStudyRecord,
} from "@/lib/history/storage";

const input = (isCorrect: boolean, text = "こんにちは"): NewStudyRecord => ({
  videoId: "abc123",
  entry: { text, start: 12.5, duration: 2 },
  userTranslation: "안녕하세요",
  result: {
    isCorrect,
    score: isCorrect ? 90 : 30,
    correctedTranslation: "안녕하세요",
    explanation: "",
  },
});

describe("history storage", () => {
  beforeEach(() => localStorage.clear());

  it("persists records across loads with a timestamp", () => {
    saveRecord(input(true), new Date("2026-10-21T00:00:00Z"));
    saveRecord(input(false, "ありがとう"));

    const history = loadHistory();
    expect(history).toHaveLength(2);
    expect(history[0]).toMatchObject({
      videoId: "abc123",
      entry: { text: "こんにちは", start: 12.5 },
      verifiedAt: "2026-10-21T00:00:00.000Z",
    });
    expect(history[1].entry.text).toBe("ありがとう");
  });

  it("returns an empty list when stored data is corrupt", () => {
    localStorage.setItem(HISTORY_STORAGE_KEY, "{not json");
    expect(loadHistory()).toEqual([]);
  });

  it("does not throw when storage is full", () => {
    const full = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("full", "QuotaExceededError");
      },
    } as unknown as Storage;
    expect(() => saveRecord(input(true), new Date(), full)).not.toThrow();
  });

  it("sorts wrong answers first, newest first within each group", () => {
    const records = [
      saveRecord(input(true, "a"), new Date("2026-10-01")),
      saveRecord(input(false, "b"), new Date("2026-10-02")),
      saveRecord(input(true, "c"), new Date("2026-10-03")),
      saveRecord(input(false, "d"), new Date("2026-10-04")),
    ];
    expect(sortForReview(records).map((r) => r.entry.text)).toEqual([
      "d",
      "b",
      "c",
      "a",
    ]);
  });
});
