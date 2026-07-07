---
name: release
description: Release Kiko — production / hotfix 절차. Use when the user wants to ship, deploy, cut a release, bump a version, or "릴리즈 하자".
---

# Release: Kiko

`main` = 프로덕션. `main`에 머지/푸시하면 GitHub Actions가 self-hosted 러너에서 자동 배포한다. staging 없음.

## Production (main)

1. **PR → main**: 기능/수정 브랜치에서 `main`으로 PR을 연다. CI(`.github/workflows/ci.yml`, PR trigger)가 lint → `pnpm test` → `pnpm build` → Playwright E2E를 돌린다. 초록 확인.
2. **버전 bump (릴리즈 단위일 때만)**: semver. `package.json`의 `version`을 올리고(major.minor.patch) 태그를 단다. 일상 커밋에서는 건드리지 않는다.
   - `git tag v<x.y.z> && git push origin v<x.y.z>`
3. **머지**: PR을 `main`에 머지한다 (또는 직접 push). 이게 배포 트리거다.
4. **자동 배포**: `Deploy` 워크플로(`.github/workflows/deploy.yml`, `push: branches:[main]`)가 self-hosted 러너 `[self-hosted, kiko]`에서 실행:
   - `secrets.YOUTUBE_API_KEY`로 `.env.production` 생성
   - `bash scripts/deploy.sh` — blue-green 배포(비활성 color 빌드 → 헬스체크 → nginx upstream 전환)
5. **검증**: 워크플로가 `curl -sf http://localhost:3010/`로 자동 확인. Actions 탭에서 `Deploy` 잡이 초록인지 본다. 필요하면 프로덕션 URL도 직접 확인.

## Hotfix

1. `main`에서 `hotfix/<설명>` 브랜치를 딴다.
2. 수정 → 커밋 → PR to `main`. CI 통과 확인.
3. `main`에 머지 → 위 Production 자동 배포 경로로 나간다 (별도 배포 명령 없음).
4. 긴급 패치면 patch 버전 bump + 태그.

## Notes
- 배포는 **push-to-main 자동**이다. 수동 배포 명령을 따로 실행하지 않는다 — `scripts/deploy.sh`는 러너가 부른다.
- blue-green이므로 롤백은 이전 color로 nginx upstream을 되돌리면 된다 (`scripts/deploy.sh`의 `set_upstream` 참조).
- staging 브랜치/환경 없음. `dev` 브랜치는 배포를 트리거하지 않는다.
