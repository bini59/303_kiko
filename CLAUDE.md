# Kiko - 일본어 학습 플랫폼

## 프로젝트 개요
유튜브 영상 기반 일본어 학습 MVP. 자막 동기화 + LLM 번역 검증.

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (Hand-Drawn 디자인 시스템)
- Vitest + Playwright
- pnpm

## 주요 명령어
- `pnpm dev` - 개발 서버
- `pnpm build` - 프로덕션 빌드
- `pnpm test` - Vitest 테스트
- `pnpm test:e2e` - Playwright E2E 테스트

## API 키
- YouTube Data API v3: `.env.local` → `YOUTUBE_API_KEY`
- Translation Verification: 서버 전용 `LLM_API_KEY`, `LLM_BASE_URL`(기본 OpenAI v1), `LLM_MODEL`(기본 gpt-4o-mini). 운영 Compose는 OmniRoute 사용.

## 디자인 시스템
- `.claude/STYLE.md` 참조
- Hand-Drawn 스타일: wobbly borders, hard offset shadows, 수기체 폰트
- 색상: #fdfbf7 (배경), #2d2d2d (전경), #ff4d4d (강조), #2d5da1 (보조)

## 아키텍처
- LLM: 전략 패턴 (`LLMProvider` 인터페이스 → OpenAI 구현체)
- YouTube: Data API v3 + 자막 추출
- 자막 캐시: 추출 성공한 Transcript를 SQLite(`node:sqlite`, Node 22+)에 videoId 키로 저장, 캐시 우선 조회 (`TRANSCRIPT_CACHE_PATH`, 기본 `data/kiko.db`)
- 자막 동기화: YouTube IFrame API onStateChange + 타임스탬프 매칭

## 작업 플로우
모든 작업은 `dev-flow`로 시작한다.
- **이슈 인입**: `gh-issue` 스킬 ("이슈 가져와") → 스코프 grilling → planner
- **계획**: `planner` 에이전트 (트랙 판별 + `tmp/TODO.md`)
- **구현**: `dev-workflow` 스킬 (light/heavy 트랙)
- **리뷰**: `review-gate` 스킬 (머지 전 필수)
- **릴리즈**: `release` 스킬 ("릴리즈 하자") — main push → 자동 배포
- **도메인 용어/결정**: `CONTEXT.md` (ubiquitous language) 유지

## 작업 규칙
1. TDD: 테스트 먼저 → 구현 → 리팩토링
2. 모든 테스트 통과 전 다음 태스크 진행 금지
3. 각 태스크 완료 시 CLAUDE.md 업데이트
4. 커버리지 80% 이상 유지

## 진행 상황
- [x] Phase 0: 프로젝트 초기화
- [x] Phase 1: YouTube URL 파싱
- [x] Phase 2: YouTube API 연동
- [x] Phase 3: 일본어 감지
- [x] Phase 4: 영상 플레이어 & 자막 동기화
- [x] Phase 5: LLM 번역 검증
- [x] Phase 6: 통합 & E2E

## #25 학습 기록
- 검증 결과를 localStorage에 누적하고 학습 기록 화면에서 오답 우선 조회.
- LearnView에서 클릭한 자막을 번역 검증하며 키 입력 UI 없이 서버 게이트웨이 사용.
- `LLM_API_KEY` 미설정 시 503. 실제 LLM 호출은 테스트에서 mock 처리.
- 리뷰 보완: 서버 프로세스 전체 분당 20회/24시간 200회/동시 2회 제한(429 + Retry-After), 본문 16KiB 및 각 입력 2,000자 제한. provider는 30초 timeout 및 출력 1,000토큰 제한.
- 판정 응답은 서버/provider/UI/저장 시 구조 검사. 기록 로드 시 잘못된 원소만 제외하고 정상 기록 보존.

## 테스트 현황
- 단위/통합 테스트: 15개 파일, 88 테스트
- E2E 테스트: 1개 파일, 6 테스트
- 전체 통과 (typecheck + build 포함)

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
