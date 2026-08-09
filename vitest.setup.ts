// Estende o expect do Vitest com os matchers do @testing-library/jest-dom
// (ex.: toBeInTheDocument, toBeVisible) para os testes de componente.
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './src/mocks/server';

// jsdom nao implementa ResizeObserver — usado por varios componentes do AntD (Modal, Card...).
if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jsdom nao implementa matchMedia — o AntD usa para observar breakpoints (Grid/Table/Layout).
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// Servidor MSW global para os testes de componente que consomem a API (CARD-16) — cada teste
// registra seus handlers via `server.use(...)` e o `resetHandlers` limpa entre testes.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
