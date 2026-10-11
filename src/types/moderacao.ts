export type StatusContestacao = 'PENDENTE' | 'MANTIDA' | 'SEPARADA' | 'REJEITADA';

export type AcaoContestacao = 'MANTER' | 'SEPARAR' | 'REJEITAR';

export interface ContestacaoFilaResponse {
  id: string;
  reclamacaoId: string;
  contestanteId: string;
  justificativa: string;
  status: StatusContestacao;
  criadoEm: string;
  reclamacaoTitulo: string;
  reclamacaoDescricao: string;
  consolidadaId: string | null;
  consolidadaTitulo: string | null;
  consolidadaDescricao: string | null;
  similaridade: number | null;
  thresholdUsado: number | null;
}

export interface ResolverContestacaoRequest {
  acao: AcaoContestacao;
  observacao?: string;
}

export type AcaoSinalizado = 'APROVAR' | 'MANTER_BLOQUEIO';

export interface SinalizadoResponse {
  id: string;
  reclamacaoId: string;
  motivo: string;
  criadoEm: string;
}

export interface ResolverSinalizadoRequest {
  acao: AcaoSinalizado;
}

export type AcaoImagem = 'APROVAR' | 'REPROVAR';

export interface ImagemModeracaoResponse {
  id: string;
  urlMiniatura: string;
  urlGrande: string;
}

export interface ImagensPendentesResponse {
  reclamacaoId: string;
  titulo: string;
  descricao: string;
  imagens: ImagemModeracaoResponse[];
}

export interface ResolverImagensRequest {
  acao: AcaoImagem;
  motivo?: string;
}

export type TipoAcaoModerador =
  | 'ACESSO_FILA_CONTESTACOES'
  | 'CONTESTACAO_MANTIDA'
  | 'CONTESTACAO_SEPARADA'
  | 'CONTESTACAO_REJEITADA'
  | 'SINALIZADO_APROVADO'
  | 'SINALIZADO_MANTIDO_BLOQUEIO'
  | 'IMAGENS_APROVADAS'
  | 'IMAGENS_REPROVADAS';

export interface AcaoModeradorResponse {
  id: string;
  moderadorId: string;
  tipo: TipoAcaoModerador;
  alvoId: string | null;
  detalhe: string | null;
  criadoEm: string;
}

export interface HistoricoFiltro {
  tipo?: TipoAcaoModerador;
  de?: string;
  ate?: string;
}

export interface ConfiguracaoResponse {
  chave: string;
  valor: string;
  atualizadoEm: string;
}

export interface AtualizarConfiguracaoRequest {
  valor: string;
}

export interface AgregacaoStatusResponse {
  tamanhoStream: number;
  pendentes: number;
  processadas: number;
  falhas: number;
  mediaSimilaridadeRecente: number | null;
  consultadoEm: string;
}
