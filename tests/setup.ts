import '@testing-library/jest-dom/vitest'

// transcript 캐시가 테스트 중 디스크에 DB 파일을 만들지 않도록
process.env.TRANSCRIPT_DB_PATH = ':memory:'

// jsdom에 없는 scrollIntoView 스텁 (활성 자막으로 스크롤하는 컴포넌트 테스트용)
Element.prototype.scrollIntoView = () => {}
