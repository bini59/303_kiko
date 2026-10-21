import { TranscriptEntry } from "@/lib/youtube/types";
import { VerifyResult } from "@/lib/llm/types";

// 학습 기록(Study Record): Translation Verification 1회의 결과를 localStorage에 축적한다.
// 계정/서버 저장으로 승격할 때 이 구조를 그대로 옮길 수 있도록 평탄한 JSON으로 유지.
export interface StudyRecord {
  id: string;
  videoId: string;
  entry: TranscriptEntry;
  userTranslation: string;
  result: VerifyResult;
  verifiedAt: string; // ISO 8601
}

export type NewStudyRecord = Omit<StudyRecord, "id" | "verifiedAt">;

export const HISTORY_STORAGE_KEY = "kiko_study_history_v1";

function getStorage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function loadHistory(storage: Storage | null = getStorage()): StudyRecord[] {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(HISTORY_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return []; // 손상된 데이터는 무시하고 빈 기록으로 시작
  }
}

export function saveRecord(
  input: NewStudyRecord,
  now: Date = new Date(),
  storage: Storage | null = getStorage()
): StudyRecord {
  const record: StudyRecord = {
    ...input,
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    verifiedAt: now.toISOString(),
  };
  if (!storage) return record;
  try {
    storage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify([...loadHistory(storage), record])
    );
  } catch {
    // shortcut: 용량 초과(QuotaExceededError) 시 저장만 건너뛴다. 검증 흐름은 막지 않음.
  }
  return record;
}

// 복습용 정렬: 오답 먼저, 같은 그룹 안에서는 최신순.
export function sortForReview(records: StudyRecord[]): StudyRecord[] {
  return [...records].sort((a, b) => {
    if (a.result.isCorrect !== b.result.isCorrect) {
      return a.result.isCorrect ? 1 : -1;
    }
    return b.verifiedAt.localeCompare(a.verifiedAt);
  });
}
