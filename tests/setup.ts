import '@testing-library/jest-dom/vitest'

// transcript 캐시가 테스트 중 디스크에 DB 파일을 만들지 않도록.
// 주의: :memory: DB는 프로세스 전역 싱글턴이라 테스트 간 리셋되지 않는다 —
// 캐시를 거치는 테스트는 videoId를 테스트마다 유일하게 쓸 것 (아니면 silent cache hit).
process.env.TRANSCRIPT_DB_PATH = ':memory:'

// jsdom에 없는 scrollIntoView 스텁 (활성 자막으로 스크롤하는 컴포넌트 테스트용)
Element.prototype.scrollIntoView = () => {}
