// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { VerifyPanel } from '@/components/VerifyPanel';
import { loadHistory } from '@/lib/history/storage';

beforeEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });

it('saves a successful verification with its original video and transcript entry', async () => {
  const result = { isCorrect: false, score: 40, correctedTranslation: '안녕하세요', explanation: '인사입니다' };
  const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => result } as Response);
  render(<VerifyPanel videoId="video-a" entry={{ text: 'こんにちは', start: 12, duration: 3 }} />);
  fireEvent.change(screen.getByLabelText('내 번역'), { target: { value: '안녕' } });
  fireEvent.click(screen.getByRole('button', { name: '검증하기' }));
  await screen.findByText('오답 · 40점');
  expect(loadHistory()).toEqual([expect.objectContaining({ videoId: 'video-a', entry: { text: 'こんにちは', start: 12, duration: 3 }, userTranslation: '안녕', result })]);
  expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toEqual({ japanese: 'こんにちは', userTranslation: '안녕' });
});

it('shows server errors without saving a record', async () => {
  vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false, json: async () => ({ error: '검증 기능이 설정되지 않았습니다' }) } as Response);
  render(<VerifyPanel videoId="video-a" entry={{ text: 'こんにちは', start: 12, duration: 3 }} />);
  fireEvent.change(screen.getByLabelText('내 번역'), { target: { value: '안녕' } });
  fireEvent.click(screen.getByRole('button', { name: '검증하기' }));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('검증 기능이 설정되지 않았습니다'));
  expect(loadHistory()).toEqual([]);
});
