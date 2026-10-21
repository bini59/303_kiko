import { NextRequest, NextResponse } from "next/server";
import { createLLMProvider } from "@/lib/llm/factory";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { japanese, userTranslation } = body;
    const apiKey = process.env.LLM_API_KEY;

    if (typeof japanese !== "string" || !japanese.trim() || typeof userTranslation !== "string" || !userTranslation.trim()) {
      return NextResponse.json(
        { error: "japanese와 userTranslation 필드가 필요합니다" },
        { status: 400 }
      );
    }

    if (!apiKey?.trim()) {
      return NextResponse.json(
        { error: "검증 기능이 설정되지 않았습니다" },
        { status: 503 }
      );
    }

    const provider = createLLMProvider("openai", { apiKey });
    const result = await provider.verify({ japanese, userTranslation });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
