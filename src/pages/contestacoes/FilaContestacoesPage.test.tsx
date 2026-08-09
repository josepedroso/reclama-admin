import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../mocks/server';
import { API_BASE_URL } from '../../config/api';
import { FilaContestacoesPage } from './FilaContestacoesPage';
import type { PaginaResponse } from '../../types/pagina';
import type { ContestacaoFilaResponse } from '../../types/moderacao';

function paginaVazia(): PaginaResponse<ContestacaoFilaResponse> {
  return { conteudo: [], pagina: 0, tamanho: 20, totalElementos: 0, totalPaginas: 0 };
}

function paginaComItens(): PaginaResponse<ContestacaoFilaResponse> {
  return {
    conteudo: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        reclamacaoId: '22222222-2222-2222-2222-222222222222',
        contestanteId: '33333333-3333-3333-3333-333333333333',
        justificativa: 'Minha reclamação não é sobre o mesmo problema.',
        status: 'PENDENTE',
        criadoEm: '2026-08-01T10:00:00Z',
        reclamacaoTitulo: 'Buraco na rua X',
        reclamacaoDescricao: 'Descrição original',
        consolidadaId: '44444444-4444-4444-4444-444444444444',
        consolidadaTitulo: 'Buracos na via principal',
        consolidadaDescricao: 'Descrição consolidada',
        similaridade: 0.92,
        thresholdUsado: 0.9,
      },
    ],
    pagina: 0,
    tamanho: 20,
    totalElementos: 1,
    totalPaginas: 1,
  };
}

describe('FilaContestacoesPage', () => {
  it('mostra estado vazio quando não há contestações pendentes', async () => {
    server.use(
      http.get(`${API_BASE_URL}/api/moderacao/contestacoes`, () => HttpResponse.json(paginaVazia()))
    );

    render(
      <MemoryRouter>
        <FilaContestacoesPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Nenhuma contestação pendente.')).toBeInTheDocument();
  });

  it('lista as contestações retornadas pela API', async () => {
    server.use(
      http.get(`${API_BASE_URL}/api/moderacao/contestacoes`, () =>
        HttpResponse.json(paginaComItens())
      )
    );

    render(
      <MemoryRouter>
        <FilaContestacoesPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Buraco na rua X')).toBeInTheDocument();
    expect(screen.getByText('Buracos na via principal')).toBeInTheDocument();
  });

  it('mostra mensagem de erro quando a API falha', async () => {
    server.use(
      http.get(`${API_BASE_URL}/api/moderacao/contestacoes`, () =>
        HttpResponse.json({ erro: 'erro', mensagem: 'Falha interna' }, { status: 500 })
      )
    );

    render(
      <MemoryRouter>
        <FilaContestacoesPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Falha interna')).toBeInTheDocument());
  });
});
