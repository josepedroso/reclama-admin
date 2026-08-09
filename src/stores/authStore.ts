import { create } from 'zustand';
import { registrarAoExpirarSessao } from '../services/api';
import * as authService from '../services/authService';
import { decodificarAccessToken, possuiPerfilModerador } from '../services/jwt';
import {
  carregarTokens,
  getAccessToken,
  getRefreshToken,
  limparTokens,
  salvarTokens,
} from '../services/tokenStore';

export type StatusSessao = 'carregando' | 'autenticado' | 'acessoNegado' | 'anonimo';

interface AuthState {
  moderadorId: string | null;
  status: StatusSessao;
  erroLogin: string | null;
  /** Le os tokens do sessionStorage na abertura do painel e valida o perfil (ROLE_MODERADOR). */
  restaurarSessao: () => void;
  login: (identificador: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
}

function aplicarToken(token: string): { moderadorId: string | null; status: StatusSessao } {
  if (!possuiPerfilModerador(token)) {
    return { moderadorId: null, status: 'acessoNegado' };
  }
  const claims = decodificarAccessToken(token);
  return { moderadorId: claims?.sub ?? null, status: 'autenticado' };
}

export const useAuthStore = create<AuthState>((set) => ({
  moderadorId: null,
  status: 'carregando',
  erroLogin: null,

  restaurarSessao: () => {
    carregarTokens();
    const token = getAccessToken();
    if (!token || !getRefreshToken()) {
      set({ moderadorId: null, status: 'anonimo' });
      return;
    }
    set(aplicarToken(token));
  },

  login: async (identificador, senha) => {
    set({ erroLogin: null });
    try {
      const tokens = await authService.login(identificador, senha);
      salvarTokens(tokens.accessToken, tokens.refreshToken);
      set(aplicarToken(tokens.accessToken));
    } catch {
      set({ status: 'anonimo', erroLogin: 'Credenciais invalidas. Verifique e tente novamente.' });
      throw new Error('login-falhou');
    }
  },

  logout: async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch {
        // Logout local acontece de qualquer forma.
      }
    }
    limparTokens();
    set({ moderadorId: null, status: 'anonimo' });
  },
}));

// Logout automatico quando o refresh falha em qualquer request autenticada.
registrarAoExpirarSessao(() => {
  useAuthStore.setState({ moderadorId: null, status: 'anonimo' });
});
