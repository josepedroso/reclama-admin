import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { API_BASE_URL } from '../config/api';
import { useAuthStore } from './authStore';

function tokenComRoles(roles: string[]): string {
  const payload = { sub: 'moderador-1', roles, iat: 1, exp: 9999999999 };
  const base64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `header.${base64}.assinatura`;
}

describe('authStore', () => {
  beforeEach(() => {
    sessionStorage.clear();
    useAuthStore.setState({ moderadorId: null, status: 'carregando', erroLogin: null });
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('autentica quando o token tem ROLE_MODERADOR', async () => {
    server.use(
      http.post(`${API_BASE_URL}/api/auth/login`, () =>
        HttpResponse.json({
          accessToken: tokenComRoles(['ROLE_MODERADOR']),
          refreshToken: 'refresh-token',
          expiraEm: 9999999999,
        })
      )
    );

    await useAuthStore.getState().login('moderador@exemplo.com', 'senha123');

    expect(useAuthStore.getState().status).toBe('autenticado');
    expect(useAuthStore.getState().moderadorId).toBe('moderador-1');
  });

  it('nega acesso quando o token não tem ROLE_MODERADOR', async () => {
    server.use(
      http.post(`${API_BASE_URL}/api/auth/login`, () =>
        HttpResponse.json({
          accessToken: tokenComRoles(['ROLE_USUARIO']),
          refreshToken: 'refresh-token',
          expiraEm: 9999999999,
        })
      )
    );

    await useAuthStore.getState().login('cidadao@exemplo.com', 'senha123');

    expect(useAuthStore.getState().status).toBe('acessoNegado');
  });

  it('marca erro de login quando as credenciais são inválidas', async () => {
    server.use(
      http.post(`${API_BASE_URL}/api/auth/login`, () =>
        HttpResponse.json(
          { erro: 'credenciais_invalidas', mensagem: 'Credenciais inválidas' },
          { status: 401 }
        )
      )
    );

    await expect(useAuthStore.getState().login('x@exemplo.com', 'errada')).rejects.toThrow();

    expect(useAuthStore.getState().status).toBe('anonimo');
    expect(useAuthStore.getState().erroLogin).toBeTruthy();
  });
});
