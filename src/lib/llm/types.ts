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
