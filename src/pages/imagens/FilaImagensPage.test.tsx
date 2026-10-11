import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { server } from '../../mocks/server';
import { API_BASE_URL } from '../../config/api';
import { FilaImagensPage } from './FilaImagensPage';
import type { PaginaResponse } from '../../types/pagina';
import type { ImagensPendentesResponse } from '../../types/moderacao';

const RECLAMACAO_ID = '77777777-7777-7777-7777-777777777777';

function paginaVazia(): PaginaResponse<ImagensPendentesResponse> {
  return { conteudo: [], pagina: 0, tamanho: 5, totalElementos: 0, totalPaginas: 0 };
}

function paginaComItem(): PaginaResponse<ImagensPendentesResponse> {
  return {
    conteudo: [
      {
        reclamacaoId: RECLAMACAO_ID,
        titulo: 'Buraco na avenida central',
        descricao: 'Buraco grande perto do semáforo',
        imagens: [1, 2, 3].map((n) => ({
          id: `00000000-0000-0000-0000-00000000000${n}`,
          urlMiniatura: `https://r2.exemplo/mini-${n}.jpg`,
          urlGrande: `https://r2.exemplo/grande-${n}.jpg`,
        })),
      },
    ],
    pagina: 0,
    tamanho: 5,
    totalElementos: 1,
    totalPaginas: 1,
  };
}

function renderizar() {
  render(
    <MemoryRouter>
      <FilaImagensPage />
    </MemoryRouter>
  );
}

function mockFila(resolvido: () => boolean) {
  server.use(
    http.get(`${API_BASE_URL}/api/moderacao/imagens`, () =>
      HttpResponse.json(resolvido() ? paginaVazia() : paginaComItem())
    ),
    http.get(`${API_BASE_URL}/api/moderacao/contestacoes`, () => HttpResponse.json(paginaVazia())),
    http.get(`${API_BASE_URL}/api/moderacao/sinalizados`, () => HttpResponse.json(paginaVazia()))
  );
}

describe('FilaImagensPage', () => {
  afterEach(cleanup);

  it('mostra estado vazio quando não há imagens pendentes', async () => {
    mockFila(() => true);
    renderizar();
    expect(await screen.findByText('Nenhuma imagem pendente de aprovação.')).toBeInTheDocument();
  });

  it('lista a reclamação com suas imagens', async () => {
    mockFila(() => false);
    renderizar();
    expect(await screen.findByText('Buraco na avenida central')).toBeInTheDocument();
    expect(screen.getByText('Buraco grande perto do semáforo')).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /Imagem \d de/ })).toHaveLength(3);
  });

  it('aprova após confirmação', async () => {
    const usuario = userEvent.setup();
    let resolvido = false;
    mockFila(() => resolvido);
    server.use(
      http.post(
        `${API_BASE_URL}/api/moderacao/imagens/${RECLAMACAO_ID}/resolver`,
        async ({ request }) => {
          const corpo = (await request.json()) as { acao: string };
          expect(corpo.acao).toBe('APROVAR');
          resolvido = true;
          return new HttpResponse(null, { status: 204 });
        }
      )
    );
    renderizar();
    await screen.findByText('Buraco na avenida central');

    await usuario.click(screen.getByRole('button', { name: /^check Aprovar$/ }));
    await usuario.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(resolvido).toBe(true));
    expect(await screen.findByText('Nenhuma imagem pendente de aprovação.')).toBeInTheDocument();
  });

  it('exige motivo para reprovar e envia o motivo informado', async () => {
    const usuario = userEvent.setup();
    let corpoRecebido: { acao: string; motivo?: string } | null = null;
    let resolvido = false;
    mockFila(() => resolvido);
    server.use(
      http.post(
        `${API_BASE_URL}/api/moderacao/imagens/${RECLAMACAO_ID}/resolver`,
        async ({ request }) => {
          corpoRecebido = (await request.json()) as { acao: string; motivo?: string };
          resolvido = true;
          return new HttpResponse(null, { status: 204 });
        }
      )
    );
    renderizar();
    await screen.findByText('Buraco na avenida central');

    await usuario.click(screen.getByRole('button', { name: /^stop Reprovar$/ }));
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled();

    await usuario.type(screen.getByLabelText('Motivo da reprovação'), 'Imagem imprópria');
    await usuario.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(resolvido).toBe(true));
    expect(corpoRecebido).toEqual({ acao: 'REPROVAR', motivo: 'Imagem imprópria' });
  });

  it('mostra mensagem de erro quando a API falha', async () => {
    server.use(
      http.get(`${API_BASE_URL}/api/moderacao/imagens`, () =>
        HttpResponse.json({ erro: 'erro', mensagem: 'Falha ao consultar' }, { status: 500 })
      )
    );
    renderizar();
    await waitFor(() => expect(screen.getByText('Falha ao consultar')).toBeInTheDocument());
  });
});
