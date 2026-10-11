import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { API_BASE_URL } from '../config/api';

const paginaVazia = { conteudo: [], pagina: 0, tamanho: 1, totalElementos: 0, totalPaginas: 0 };

/** Servidor MSW compartilhado pelos testes de componente (CARD-16). Handlers por teste via
 * `server.use(...)`. Os defaults cobrem os contadores de pendencia (pendenciasStore.atualizar),
 * disparados em segundo plano pelas telas — sem eles a request sem handler vaza apos o teardown. */
export const server = setupServer(
  http.get(`${API_BASE_URL}/api/moderacao/contestacoes`, () => HttpResponse.json(paginaVazia)),
  http.get(`${API_BASE_URL}/api/moderacao/sinalizados`, () => HttpResponse.json(paginaVazia)),
  http.get(`${API_BASE_URL}/api/moderacao/imagens`, () => HttpResponse.json(paginaVazia))
);
