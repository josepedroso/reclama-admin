import { describe, expect, it } from 'vitest';
import { decodificarAccessToken, possuiPerfilModerador } from './jwt';

function tokenComPayload(payload: object): string {
  const base64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `header.${base64}.assinatura`;
}

describe('decodificarAccessToken', () => {
  it('decodifica as claims do payload', () => {
    const token = tokenComPayload({ sub: 'usuario-1', roles: ['ROLE_MODERADOR'], iat: 1, exp: 2 });

    expect(decodificarAccessToken(token)).toEqual({
      sub: 'usuario-1',
      roles: ['ROLE_MODERADOR'],
      iat: 1,
      exp: 2,
    });
  });

  it('retorna null para um token malformado', () => {
    expect(decodificarAccessToken('token-invalido')).toBeNull();
  });
});

describe('possuiPerfilModerador', () => {
  it('retorna true quando a claim roles contém ROLE_MODERADOR', () => {
    const token = tokenComPayload({ sub: 'x', roles: ['ROLE_USUARIO', 'ROLE_MODERADOR'] });
    expect(possuiPerfilModerador(token)).toBe(true);
  });

  it('retorna false quando a claim roles não contém ROLE_MODERADOR', () => {
    const token = tokenComPayload({ sub: 'x', roles: ['ROLE_USUARIO'] });
    expect(possuiPerfilModerador(token)).toBe(false);
  });

  it('retorna false para um token malformado', () => {
    expect(possuiPerfilModerador('token-invalido')).toBe(false);
  });
});
