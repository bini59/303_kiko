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
import { POST } from '@/app/api/verify/route'

describe('POST /api/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('LLM_API_KEY', 'server-key')
  })

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
