# Kiko

YouTube 영상 기반 일본어 학습 플랫폼. 학습자가 일본어 영상의 자막을 문장 단위로 따라가며, 자신의 번역을 LLM으로 검증받는다.

## Language

**Transcript** (자막):
영상에 시간 정보와 함께 붙는 일본어 문장의 목록. 각 항목이 재생 타임스탬프를 가진다.
_Avoid_: Subtitle, caption, script

**Transcript Entry**:
Transcript를 이루는 한 줄 — 시작 시각과 일본어 텍스트 한 문장.

**Transcript Sync** (자막 동기화):
영상 재생 위치에 맞춰 현재 재생 중인 Transcript Entry를 강조하는 동작.

**Translation Verification** (번역 검증):
학습자가 입력한 (한국어) 번역이 원문 일본어 문장의 뜻과 맞는지 LLM이 판정하는 것. Kiko의 핵심 학습 루프.
_Avoid_: Translation check, grading

**LLM Provider**:
Translation Verification를 수행하는 번역 검증 엔진의 추상 인터페이스. 구현체는 교체 가능하다(전략 패턴).
