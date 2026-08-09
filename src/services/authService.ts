import { apiFetch } from './api';
import type { LoginRequest, TokenResponse } from '../types/auth';

export function login(identificador: string, senha: string): Promise<TokenResponse> {
  const corpo: LoginRequest = { identificador, senha };
  return apiFetch<TokenResponse>('/api/auth/login', { metodo: 'POST', corpo, autenticado: false });
}

export async function logout(refreshToken: string): Promise<void> {
  await apiFetch<void>('/api/auth/logout', {
    metodo: 'POST',
    corpo: { refreshToken },
    autenticado: false,
  });
}
