import { apiFetch } from './api';
import type { PaginaResponse } from '../types/pagina';
import type {
  AcaoModeradorResponse,
  AgregacaoStatusResponse,
  AtualizarConfiguracaoRequest,
  ConfiguracaoResponse,
  ContestacaoFilaResponse,
  HistoricoFiltro,
  ImagensPendentesResponse,
  ResolverContestacaoRequest,
  ResolverImagensRequest,
  ResolverSinalizadoRequest,
  SinalizadoResponse,
  StatusContestacao,
} from '../types/moderacao';

export function listarContestacoes(
  pagina: number,
  tamanho = 20,
  status: StatusContestacao = 'PENDENTE'
): Promise<PaginaResponse<ContestacaoFilaResponse>> {
  return apiFetch(
    `/api/moderacao/contestacoes?status=${status}&pagina=${pagina}&tamanho=${tamanho}`
  );
}

export function resolverContestacao(id: string, req: ResolverContestacaoRequest): Promise<void> {
  return apiFetch(`/api/moderacao/contestacoes/${id}/resolver`, { metodo: 'POST', corpo: req });
}

export function listarSinalizados(
  pagina: number,
  tamanho = 20
): Promise<PaginaResponse<SinalizadoResponse>> {
  return apiFetch(`/api/moderacao/sinalizados?pagina=${pagina}&tamanho=${tamanho}`);
}

export function resolverSinalizado(id: string, req: ResolverSinalizadoRequest): Promise<void> {
  return apiFetch(`/api/moderacao/sinalizados/${id}/resolver`, { metodo: 'POST', corpo: req });
}

export function listarImagensPendentes(
  pagina: number,
  tamanho = 20
): Promise<PaginaResponse<ImagensPendentesResponse>> {
  return apiFetch(`/api/moderacao/imagens?pagina=${pagina}&tamanho=${tamanho}`);
}

export function resolverImagens(reclamacaoId: string, req: ResolverImagensRequest): Promise<void> {
  return apiFetch(`/api/moderacao/imagens/${reclamacaoId}/resolver`, {
    metodo: 'POST',
    corpo: req,
  });
}

export function listarHistorico(
  pagina: number,
  tamanho = 20,
  filtro: HistoricoFiltro = {}
): Promise<PaginaResponse<AcaoModeradorResponse>> {
  const params = new URLSearchParams({ pagina: String(pagina), tamanho: String(tamanho) });
  if (filtro.tipo) params.set('tipo', filtro.tipo);
  if (filtro.de) params.set('de', filtro.de);
  if (filtro.ate) params.set('ate', filtro.ate);
  return apiFetch(`/api/moderacao/acoes?${params.toString()}`);
}

export function listarConfiguracoes(): Promise<ConfiguracaoResponse[]> {
  return apiFetch('/api/admin/configuracoes');
}

export function atualizarConfiguracao(
  chave: string,
  req: AtualizarConfiguracaoRequest
): Promise<ConfiguracaoResponse> {
  return apiFetch(`/api/admin/configuracoes/${chave}`, { metodo: 'PUT', corpo: req });
}

export function consultarStatusAgregacao(): Promise<AgregacaoStatusResponse> {
  return apiFetch('/api/admin/agregacao/status');
}
