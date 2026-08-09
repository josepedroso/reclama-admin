import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../mocks/server';
import { API_BASE_URL } from '../../config/api';
import { FilaSinalizadosPage } from './FilaSinalizadosPage';
import type { PaginaResponse } from '../../types/pagina';
import type { SinalizadoResponse } from '../../types/moderacao';

function paginaVazia(): PaginaResponse<SinalizadoResponse> {
  return { conteudo: [], pagina: 0, tamanho: 20, totalElementos: 0, totalPaginas: 0 };
}

function paginaComItem(): PaginaResponse<SinalizadoResponse> {
  return {
    conteudo: [
      {
        id: '55555555-5555-5555-5555-555555555555',
        reclamacaoId: '66666666-6666-6666-6666-666666666666',
        motivo: 'Linguagem ofensiva detectada',
        criadoEm: '2026-08-01T10:00:00Z',
      },
    ],
    pagina: 0,
    tamanho: 20,
    totalElementos: 1,
    totalPaginas: 1,
  };
}

describe('FilaSinalizadosPage', () => {
  it('mostra estado vazio quando não há sinalizados pendentes', async () => {
    server.use(
      http.get(`${API_BASE_URL}/api/moderacao/sinalizados`, () => HttpResponse.json(paginaVazia()))
    );

    render(
      <MemoryRouter>
        <FilaSinalizadosPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Nenhum conteúdo sinalizado pendente.')).toBeInTheDocument();
  });

  it('lista os sinalizados e resolve com Aprovar após confirmação', async () => {
    const usuario = userEvent.setup();
    let resolvido = false;
    server.use(
      http.get(`${API_BASE_URL}/api/moderacao/sinalizados`, () =>
        HttpResponse.json(resolvido ? paginaVazia() : paginaComItem())
      ),
      http.get(`${API_BASE_URL}/api/moderacao/contestacoes`, () =>
        HttpResponse.json(paginaVazia())
      ),
      http.post(
        `${API_BASE_URL}/api/moderacao/sinalizados/55555555-5555-5555-5555-555555555555/resolver`,
        async ({ request }) => {
          const corpo = (await request.json()) as { acao: string };
          expect(corpo.acao).toBe('APROVAR');
          resolvido = true;
          return new HttpResponse(null, { status: 204 });
        }
      )
    );

    render(
      <MemoryRouter>
        <FilaSinalizadosPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Linguagem ofensiva detectada')).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: /^check Aprovar$/ }));
    await usuario.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(resolvido).toBe(true));
  });

  it('mostra mensagem de erro quando a API falha', async () => {
    server.use(
      http.get(`${API_BASE_URL}/api/moderacao/sinalizados`, () =>
        HttpResponse.json({ erro: 'erro', mensagem: 'Falha ao consultar' }, { status: 500 })
      )
    );

    render(
      <MemoryRouter>
        <FilaSinalizadosPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Falha ao consultar')).toBeInTheDocument());
  });
});
