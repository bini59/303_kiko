import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/llm/factory', () => ({
  createLLMProvider: vi.fn(() => ({
    name: 'openai',
    verify: vi.fn().mockResolvedValue({
      isCorrect: true,
      score: 95,
      correctedTranslation: '안녕하세요',
      explanation: '정확한 번역입니다',
    }),
  })),
}))

import { createLLMProvider } from '@/lib/llm/factory'
let POST: typeof import('@/app/api/verify/route').POST;
beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.mocked(createLLMProvider).mockReturnValue({ name: 'test', verify: vi.fn().mockResolvedValue({ isCorrect: true, score: 95, correctedTranslation: '안녕하세요', explanation: '' }) });
  vi.stubEnv('LLM_API_KEY', 'server-key');
  POST = (await import('@/app/api/verify/route')).POST;
});

describe('POST /api/verify', () => {
  it('returns verification result for valid request', async () => {
    const request = new NextRequest('http://localhost:3000/api/verify', {
      method: 'POST',
      body: JSON.stringify({
        japanese: 'こんにちは',
        userTranslation: '안녕하세요',
        apiKey: 'ignored-client-key',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.isCorrect).toBe(true)
    expect(data.score).toBe(95)
    expect(createLLMProvider).toHaveBeenCalledWith('openai', expect.objectContaining({ apiKey: 'server-key' }))
  })

  it('returns 400 for missing fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/verify', {
      method: 'POST',
      body: JSON.stringify({ japanese: 'こんにちは' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('returns 503 when server key is missing', async () => {
    vi.stubEnv('LLM_API_KEY', '')
    const request = new NextRequest('http://localhost:3000/api/verify', {
      method: 'POST',
      body: JSON.stringify({
        japanese: 'こんにちは',
        userTranslation: '안녕하세요',
        apiKey: 'cannot-enable-server',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(503)
    expect(createLLMProvider).not.toHaveBeenCalled()
    const data = await response.json()
    expect(data.error).toBe('검증 기능이 설정되지 않았습니다')
  })
})

const request = (body: unknown = { japanese: 'こんにちは', userTranslation: '안녕' }) => new NextRequest('http://localhost/api/verify', { method: 'POST', body: JSON.stringify(body), headers: { 'x-forwarded-for': String(Math.random()) } });

it('rejects oversized and malformed bodies before creating a provider', async () => {
  for (const body of [null, {}, { japanese: 'a'.repeat(2001), userTranslation: 'b' }, { japanese: 'a', userTranslation: 'b', padding: 'x'.repeat(17000) }]) {
    expect([400, 413]).toContain((await POST(request(body))).status);
  }
  expect(createLLMProvider).not.toHaveBeenCalled();
});

it('limits simultaneous calls and releases slots after errors', async () => {
  const rejects: ((error: Error) => void)[] = [];
  vi.mocked(createLLMProvider).mockReturnValue({ name: 'test', verify: () => new Promise((_, r) => { rejects.push(r); }) });
  const first = POST(request());
  await vi.waitFor(() => expect(createLLMProvider).toHaveBeenCalledTimes(1));
  const second = POST(request());
  await vi.waitFor(() => expect(createLLMProvider).toHaveBeenCalledTimes(2));
  const rejectSecond = rejects[1];
  expect((await POST(request())).status).toBe(429);
  // Settle each pending provider independently.
  rejectSecond(new Error('provider failed'));
  await second;
  vi.mocked(createLLMProvider).mockReturnValue({ name: 'test', verify: async () => ({ isCorrect: true, score: 100, correctedTranslation: '', explanation: '' }) });
  expect((await POST(request())).status).toBe(200);
  rejects[0](new Error('failed'));
  await first;
});

it('enforces minute and daily limits independently of client headers', async () => {
  vi.useFakeTimers();
  try {
    vi.setSystemTime(new Date('2026-10-21T00:00:00Z'));
    vi.resetModules();
    POST = (await import('@/app/api/verify/route')).POST;
    for (let minute = 0; minute < 10; minute++) {
      for (let i = 0; i < 20; i++) expect((await POST(request())).status).toBe(200);
      const limited = await POST(request());
      expect(limited.status).toBe(429);
      expect(limited.headers.get('Retry-After')).toBeTruthy();
      vi.advanceTimersByTime(60_000);
    }
    expect((await POST(request())).status).toBe(429);
    expect(createLLMProvider).toHaveBeenCalledTimes(200);
    vi.advanceTimersByTime(86_400_000);
    expect((await POST(request())).status).toBe(200);
  } finally { vi.useRealTimers(); }
});

it('rejects malformed provider success results', async () => {
  vi.mocked(createLLMProvider).mockReturnValue({ name: 'test', verify: vi.fn().mockResolvedValue(null) });
  expect((await POST(request())).status).toBe(502);
});

it('bounds streamed bodies even without Content-Length', async () => {
  const oversized = new NextRequest('http://localhost/api/verify', {
    method: 'POST',
    body: new ReadableStream({ start(controller) {
      controller.enqueue(new Uint8Array(9000));
      controller.enqueue(new Uint8Array(9000));
      controller.close();
    } }),
    duplex: 'half',
  } as ConstructorParameters<typeof NextRequest>[1]);
  expect((await POST(oversized)).status).toBe(413);
  expect(createLLMProvider).not.toHaveBeenCalled();
});
