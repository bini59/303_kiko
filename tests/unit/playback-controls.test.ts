import { describe, it, expect } from 'vitest'
import { formatRemaining } from '@/components/PlaybackControls'

describe('formatRemaining', () => {
  it('formats remaining time as -m:ss', () => {
    expect(formatRemaining(30, 90)).toBe('-1:00')
    expect(formatRemaining(0, 125)).toBe('-2:05')
  })

  it('guards against negative/NaN when duration is 0 or ahead', () => {
    expect(formatRemaining(10, 0)).toBe('-0:00')
    expect(formatRemaining(100, 90)).toBe('-0:00')
  })
})
