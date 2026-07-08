import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock the youtube modules
vi.mock('@/lib/youtube/client', () => ({
  fetchVideoInfo: vi.fn(),
}))

vi.mock('@/lib/youtube/transcript', () => ({
  fetchTranscript: vi.fn(),
}))

import { GET } from '@/app/api/youtube/route'
import { fetchVideoInfo } from '@/lib/youtube/client'
import { fetchTranscript } from '@/lib/youtube/transcript'

const mockFetchVideoInfo = vi.mocked(fetchVideoInfo)
const mockFetchTranscript = vi.mocked(fetchTranscript)

describe('GET /api/youtube', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns video data for valid videoId', async () => {
    mockFetchVideoInfo.mockResolvedValueOnce({
      id: 'testId',
      title: 'Test',
      channelTitle: 'Channel',
      thumbnail: 'https://img.youtube.com/thumb.jpg',
      duration: 'PT5M',
    })

    mockFetchTranscript.mockResolvedValueOnce([
      { text: 'こんにちは', start: 0, duration: 2 },
    ])

    const request = new NextRequest('http://localhost:3000/api/youtube?videoId=testId')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.info.id).toBe('testId')
    expect(data.transcript).toHaveLength(1)
  })

  it('returns 400 for missing videoId', async () => {
    const request = new NextRequest('http://localhost:3000/api/youtube')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })

  it('returns 500 on API error', async () => {
    mockFetchVideoInfo.mockRejectedValueOnce(new Error('API failed'))

    const request = new NextRequest('http://localhost:3000/api/youtube?videoId=testId')
    const response = await GET(request)

    expect(response.status).toBe(500)
  })

  it('returns 200 with empty transcript and transcriptError when only transcript fails', async () => {
    mockFetchVideoInfo.mockResolvedValueOnce({
      id: 'failId',
      title: 'Test',
      channelTitle: 'Channel',
      thumbnail: 'https://img.youtube.com/thumb.jpg',
      duration: 'PT5M',
    })

    mockFetchTranscript.mockRejectedValueOnce(new Error('자막 추출 실패'))

    // videoId는 테스트별로 달라야 한다 — 캐시(in-memory)가 프로세스 내에서 공유되므로
    const request = new NextRequest('http://localhost:3000/api/youtube?videoId=failId')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.info.id).toBe('failId')
    expect(data.transcript).toEqual([])
    expect(data.transcriptError).toBe('자막 추출 실패')
  })
})
