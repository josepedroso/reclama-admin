import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../mocks/server';
import { API_BASE_URL } from '../../config/api';
import { AnaliseContestacaoPage } from './AnaliseContestacaoPage';
import type { PaginaResponse } from '../../types/pagina';
import type { ContestacaoFilaResponse } from '../../types/moderacao';

function item(id: string, titulo: string): ContestacaoFilaResponse {
  return {
    id,
    reclamacaoId: '22222222-2222-2222-2222-222222222222',
    contestanteId: '33333333-3333-3333-3333-333333333333',
    justificativa: 'Justificativa do contestante',
    status: 'PENDENTE',
    criadoEm: '2026-08-01T10:00:00Z',
    reclamacaoTitulo: titulo,
    reclamacaoDescricao: 'Descrição original',
    consolidadaId: '44444444-4444-4444-4444-444444444444',
    consolidadaTitulo: 'Consolidada X',
    consolidadaDescricao: 'Descrição consolidada',
    similaridade: 0.95,
    thresholdUsado: 0.9,
  };
}

function pagina(itens: ContestacaoFilaResponse[]): PaginaResponse<ContestacaoFilaResponse> {
  return { conteudo: itens, pagina: 0, tamanho: 50, totalElementos: itens.length, totalPaginas: 1 };
}

describe('AnaliseContestacaoPage', () => {
  it('mostra o texto original e a consolidada lado a lado e avança para a próxima após resolver', async () => {
    const usuario = userEvent.setup();
    const primeiro = item('11111111-1111-1111-1111-111111111111', 'Primeira contestação');
    const segundo = item('99999999-9999-9999-9999-999999999999', 'Segunda contestação');

    server.use(
      http.get(`${API_BASE_URL}/api/moderacao/contestacoes`, () =>
        HttpResponse.json(pagina([primeiro, segundo]))
      ),
      http.get(`${API_BASE_URL}/api/moderacao/imagens`, () =>
        HttpResponse.json({
          conteudo: [],
          pagina: 0,
          tamanho: 1,
          totalElementos: 0,
          totalPaginas: 0,
        })
      ),
      http.get(`${API_BASE_URL}/api/moderacao/sinalizados`, () =>
        HttpResponse.json({
          conteudo: [],
          pagina: 0,
          tamanho: 1,
          totalElementos: 0,
          totalPaginas: 0,
        })
      ),
      http.post(
        `${API_BASE_URL}/api/moderacao/contestacoes/${primeiro.id}/resolver`,
        async ({ request }) => {
          const corpo = (await request.json()) as { acao: string };
          expect(corpo.acao).toBe('MANTER');
          return new HttpResponse(null, { status: 204 });
        }
      )
    );

    render(
      <MemoryRouter initialEntries={[`/contestacoes/${primeiro.id}`]}>
        <Routes>
          <Route path="/contestacoes/:id" element={<AnaliseContestacaoPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Primeira contestação')).toBeInTheDocument();
    expect(screen.getByText('Consolidada X')).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: /Manter agregação/ }));
    await usuario.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(screen.queryByText('Primeira contestação')).not.toBeInTheDocument());
  });
});
