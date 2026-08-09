import type { AccessTokenClaims } from '../types/auth';

/**
 * Decodifica o payload de um JWT (sem verificar assinatura — o backend ja' validou; aqui so'
 * lemos as claims para decidir acesso na UI). O login nao devolve o perfil do usuario no corpo
 * (CARD-16) — a claim `roles` do access token e' a unica fonte de `ROLE_MODERADOR` no cliente.
 */
export function decodificarAccessToken(token: string): AccessTokenClaims | null {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json) as AccessTokenClaims;
  } catch {
    return null;
  }
}

export function possuiPerfilModerador(token: string): boolean {
  const claims = decodificarAccessToken(token);
  return claims?.roles?.includes('ROLE_MODERADOR') ?? false;
}
