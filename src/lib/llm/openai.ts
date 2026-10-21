import { LLMProvider, LLMProviderOptions, VerifyRequest, VerifyResult } from "./types";

export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(options: LLMProviderOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl || process.env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
    this.model = options.model || process.env.LLM_MODEL || "gpt-4o-mini";
  }

  async verify(request: VerifyRequest): Promise<VerifyResult> {
    const prompt = `일본어 문장과 사용자의 한국어 번역을 비교하여 번역 품질을 평가해주세요.

일본어 원문: ${request.japanese}
사용자 번역: ${request.userTranslation}

다음 JSON 형식으로만 응답해주세요:
{
  "isCorrect": true/false (번역이 정확한지),
  "score": 0-100 (번역 품질 점수),
  "correctedTranslation": "올바른 한국어 번역",
  "explanation": "번역 평가 설명"
}`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "당신은 일본어-한국어 번역 전문가입니다. 반드시 유효한 JSON 형식으로만 응답하세요.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage =
        errorData?.error?.message || `HTTP ${response.status}`;
      throw new Error(`OpenAI API 오류: ${errorMessage}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    const json = content.trim().replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i, "$1");
    return JSON.parse(json.trim()) as VerifyResult;
  }
}
