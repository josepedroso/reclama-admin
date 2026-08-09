import { API_BASE_URL } from '../config/api';
import type { TokenResponse } from '../types/auth';
import { getAccessToken, getRefreshToken, limparTokens, salvarTokens } from './tokenStore';

/** Erro de API com o status HTTP e o codigo (`erro`) do corpo padronizado do backend. */
export class ApiError extends Error {
  status: number;
  codigo: string;

  constructor(status: number, codigo: string, mensagem: string) {
    super(mensagem);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo;
  }
}

interface OpcoesRequest {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  corpo?: unknown;
  /** Injeta o access token e ativa o fluxo de refresh em 401. Default true — quase todo
   * endpoint do painel exige ROLE_MODERADOR (excecao: login). */
  autenticado?: boolean;
}

// Callback disparado quando a sessao expira de vez (refresh falhou). O authStore registra o
// logout aqui, evitando dependencia direta api -> store.
let aoExpirarSessao: (() => void) | null = null;
export function registrarAoExpirarSessao(cb: () => void): void {
  aoExpirarSessao = cb;
}

// Deduplica refresh concorrente: varias requests que tomam 401 ao mesmo tempo compartilham
// a mesma tentativa de renovacao.
let refreshEmAndamento: Promise<boolean> | null = null;

/**
 * Renova o par de tokens usando o refresh token atual. Vai direto ao endpoint (sem passar por
 * este wrapper) para nao recursar no interceptor de 401.
 */
export async function renovarTokens(): Promise<boolean> {
  if (!refreshEmAndamento) {
    refreshEmAndamento = executarRefresh().finally(() => {
      refreshEmAndamento = null;
    });
  }
  return refreshEmAndamento;
}

async function executarRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const resp = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!resp.ok) return false;
    const tokens = (await resp.json()) as TokenResponse;
    salvarTokens(tokens.accessToken, tokens.refreshToken);
    return true;
  } catch {
    return false;
  }
}

/**
 * Wrapper HTTP central: injeta o access token, trata o corpo de erro padronizado e, em 401 numa
 * request autenticada, tenta um refresh uma unica vez e refaz a request. Se o refresh falhar,
 * limpa a sessao e dispara `aoExpirarSessao` (logout automatico).
 */
export async function apiFetch<T>(caminho: string, opcoes: OpcoesRequest = {}): Promise<T> {
  const { metodo = 'GET', corpo, autenticado = true } = opcoes;

  const montar = (): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (corpo !== undefined) headers['Content-Type'] = 'application/json';
    if (autenticado) {
      const token = getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    return fetch(`${API_BASE_URL}${caminho}`, {
      method: metodo,
      headers,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  };

  let resp = await montar();

  if (resp.status === 401 && autenticado) {
    const renovado = await renovarTokens();
    if (renovado) {
      resp = await montar();
    }
    if (!renovado || resp.status === 401) {
      limparTokens();
      aoExpirarSessao?.();
      throw await erroDaResposta(resp);
    }
  }

  if (!resp.ok) {
    throw await erroDaResposta(resp);
  }

  return parseCorpo<T>(resp);
}

async function parseCorpo<T>(resp: Response): Promise<T> {
  if (resp.status === 204) return undefined as T;
  const texto = await resp.text();
  return (texto ? JSON.parse(texto) : undefined) as T;
}

async function erroDaResposta(resp: Response): Promise<ApiError> {
  let codigo = 'erro';
  let mensagem = 'Nao foi possivel concluir a operacao. Tente novamente.';
  try {
    const corpo = (await resp.json()) as { erro?: string; mensagem?: string };
    if (corpo.erro) codigo = corpo.erro;
    if (corpo.mensagem) mensagem = corpo.mensagem;
  } catch {
    // resposta sem corpo JSON — mantem a mensagem generica
  }
  return new ApiError(resp.status, codigo, mensagem);
}
