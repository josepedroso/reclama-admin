// Copia em memoria para o interceptor injetar o access token sem I/O sincrono a cada request,
// espelhando o padrao do mobile (tokenStore.ts): memoria + persistencia, refresh sob demanda.
//
// Persistencia: o backend devolve os tokens no corpo JSON (nao ha cookie httpOnly — nao existe
// um BFF aqui), entao a unica opcao no navegador e' o proprio app escrever em storage. Usamos
// sessionStorage (nao localStorage): sobrevive a reload da aba mas some ao fechar o navegador,
// reduzindo a janela de exposicao do refresh token em caso de XSS (trade-off registrado em
// ADR-009 / CARD-16 — sem BFF/cookie httpOnly na v1).
const CHAVE_ACCESS = 'reclama-admin.accessToken';
const CHAVE_REFRESH = 'reclama-admin.refreshToken';

let accessTokenEmMemoria: string | null = null;
let refreshTokenEmMemoria: string | null = null;

/** Le os tokens do sessionStorage para a memoria (chamado na abertura do painel). */
export function carregarTokens(): void {
  accessTokenEmMemoria = sessionStorage.getItem(CHAVE_ACCESS);
  refreshTokenEmMemoria = sessionStorage.getItem(CHAVE_REFRESH);
}

/** Persiste um novo par de tokens (login/refresh). */
export function salvarTokens(accessToken: string, refreshToken: string): void {
  accessTokenEmMemoria = accessToken;
  refreshTokenEmMemoria = refreshToken;
  sessionStorage.setItem(CHAVE_ACCESS, accessToken);
  sessionStorage.setItem(CHAVE_REFRESH, refreshToken);
}

/** Apaga os tokens (logout, sessao expirada). */
export function limparTokens(): void {
  accessTokenEmMemoria = null;
  refreshTokenEmMemoria = null;
  sessionStorage.removeItem(CHAVE_ACCESS);
  sessionStorage.removeItem(CHAVE_REFRESH);
}

export function getAccessToken(): string | null {
  return accessTokenEmMemoria;
}

export function getRefreshToken(): string | null {
  return refreshTokenEmMemoria;
}
