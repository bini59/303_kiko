import '@testing-library/jest-dom/vitest'

// jsdom에 없는 scrollIntoView 스텁 (활성 자막으로 스크롤하는 컴포넌트 테스트용)
Element.prototype.scrollIntoView = () => {}
