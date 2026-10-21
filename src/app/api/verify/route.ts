import { NextRequest, NextResponse } from "next/server";
import { createLLMProvider } from "@/lib/llm/factory";
import { isVerifyResult } from "@/lib/llm/types";

// Global budgets per server process, deliberately independent of spoofable client IPs.
// Multi-process deployments must divide these budgets or use a shared limiter.
const MAX_BODY_BYTES = 16 * 1024;
const MAX_FIELD_LENGTH = 2000;
let active = 0;
let minute = { start: Date.now(), count: 0 };
let day = { start: Date.now(), count: 0 };

function reserve(): number {
  const now = Date.now();
  if (now - minute.start >= 60_000) minute = { start: now, count: 0 };
  if (now - day.start >= 86_400_000) day = { start: now, count: 0 };
  if (day.count >= 200) return Math.max(1, Math.ceil((day.start + 86_400_000 - now) / 1000));
  if (minute.count >= 20) return Math.max(1, Math.ceil((minute.start + 60_000 - now) / 1000));
  if (active >= 2) return 1;
  minute.count++;
  day.count++;
  active++;
  return 0;
}

async function readBody(request: NextRequest): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) throw new RangeError();
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new RangeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await readBody(request);
  } catch (error) {
    return NextResponse.json({ error: "요청 본문이 올바르지 않거나 너무 큽니다" }, { status: error instanceof RangeError ? 413 : 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "검증할 문장이 필요합니다" }, { status: 400 });
  }
  const { japanese, userTranslation } = body as Record<string, unknown>;
  if (typeof japanese !== "string" || !japanese.trim() || typeof userTranslation !== "string" || !userTranslation.trim()) {
    return NextResponse.json({ error: "japanese와 userTranslation 필드가 필요합니다" }, { status: 400 });
  }
  if (japanese.length > MAX_FIELD_LENGTH || userTranslation.length > MAX_FIELD_LENGTH) {
    return NextResponse.json({ error: "각 문장은 2,000자 이하여야 합니다" }, { status: 413 });
  }
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey?.trim()) {
    return NextResponse.json({ error: "검증 기능이 설정되지 않았습니다" }, { status: 503 });
  }
  const retryAfter = reserve();
  if (retryAfter) {
    return NextResponse.json({ error: "검증 요청이 많습니다. 잠시 후 다시 시도해주세요" }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
  }
  try {
    const provider = createLLMProvider("openai", { apiKey });
    const result = await provider.verify({ japanese, userTranslation });
    if (!isVerifyResult(result)) {
      return NextResponse.json({ error: "검증 응답 형식이 올바르지 않습니다" }, { status: 502 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "검증에 실패했습니다. 잠시 후 다시 시도해주세요" }, { status: 502 });
  } finally {
    active--;
  }
}
