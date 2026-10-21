export interface VerifyRequest {
  japanese: string;
  userTranslation: string;
}

export interface VerifyResult {
  isCorrect: boolean;
  score: number;
  correctedTranslation: string;
  explanation: string;
}

export interface LLMProviderOptions {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export interface LLMProvider {
  name: string;
  verify(request: VerifyRequest): Promise<VerifyResult>;
}

export function isVerifyResult(value: unknown): value is VerifyResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  return typeof result.isCorrect === "boolean" &&
    typeof result.score === "number" && Number.isFinite(result.score) && result.score >= 0 && result.score <= 100 &&
    typeof result.correctedTranslation === "string" && typeof result.explanation === "string";
}
