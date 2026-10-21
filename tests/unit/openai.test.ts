import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OpenAIProvider } from '@/lib/llm/openai'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('OpenAIProvider', () => {
  const provider = new OpenAIProvider({ apiKey: 'test-api-key' })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('has name "openai"', () => {
    expect(provider.name).toBe('openai')
  })

  it('sends correct request and parses response', async () => {
    const mockResponse = {
      isCorrect: false,
      score: 70,
      correctedTranslation: '안녕하세요',
      explanation: '번역이 대체로 맞지만 뉘앙스가 다릅니다',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify(mockResponse),
          },
        }],
      }),
    })

    const result = await provider.verify({
      japanese: 'こんにちは',
      userTranslation: '안녕',
    })

    expect(result).toEqual(mockResponse)
    expect(mockFetch).toHaveBeenCalledOnce()

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://api.openai.com/v1/chat/completions')
    expect(options.method).toBe('POST')
    expect(options.headers.Authorization).toBe('Bearer test-api-key')

    const body = JSON.parse(options.body)
    expect(body.model).toBe('gpt-4o-mini')
  })

  it('throws on API error with message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({
        error: { message: 'Rate limit exceeded' },
      }),
    })

    await expect(
      provider.verify({ japanese: 'テスト', userTranslation: '테스트' })
    ).rejects.toThrow('OpenAI API 오류: Rate limit exceeded')
  })
})

it('uses gateway configuration and parses fenced JSON', async () => {
  const result = { isCorrect: true, score: 100, correctedTranslation: '테스트', explanation: '정확함' }
  mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ choices: [{ message: { content: '```json\n' + JSON.stringify(result) + '\n```' } }] }) })
  const gateway = new OpenAIProvider({ apiKey: 'gateway-key', baseUrl: 'http://omniroute:20128/v1/', model: 'gateway-model' })
  expect(await gateway.verify({ japanese: 'テスト', userTranslation: '테스트' })).toEqual(result)
  const [url, options] = mockFetch.mock.calls.at(-1)!
  expect(url).toBe('http://omniroute:20128/v1/chat/completions')
  expect(JSON.parse(options.body).model).toBe('gateway-model')
  expect(options.headers.Authorization).toBe('Bearer gateway-key')
})

it('reads gateway base URL and model from server environment', async () => {
  vi.stubEnv('LLM_BASE_URL', 'http://gateway/v1');
  vi.stubEnv('LLM_MODEL', 'configured-model');
  try {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ isCorrect: true, score: 100, correctedTranslation: '테스트', explanation: '' }) } }] }) });
    await new OpenAIProvider({ apiKey: 'env-key' }).verify({ japanese: 'テスト', userTranslation: '테스트' });
    const [url, options] = mockFetch.mock.calls.at(-1)!;
    expect(url).toBe('http://gateway/v1/chat/completions');
    expect(JSON.parse(options.body).model).toBe('configured-model');
  } finally {
    vi.unstubAllEnvs();
  }
});

it.each([null, {}, { isCorrect: true, score: 101, correctedTranslation: '', explanation: '' }, { isCorrect: 'true', score: 50, correctedTranslation: '', explanation: '' }])('rejects malformed provider result %s', async (value) => {
  mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(value) } }] }) });
  await expect(new OpenAIProvider({ apiKey: 'test' }).verify({ japanese: 'a', userTranslation: 'b' })).rejects.toThrow();
});
