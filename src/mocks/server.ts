import { setupServer } from 'msw/node';

/** Servidor MSW compartilhado pelos testes de componente (CARD-16). Handlers por teste via
 * `server.use(...)`. */
export const server = setupServer();
