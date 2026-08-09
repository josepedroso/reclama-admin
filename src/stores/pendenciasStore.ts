import { create } from 'zustand';
import { listarContestacoes, listarSinalizados } from '../services/moderacaoService';

interface PendenciasState {
  contestacoes: number;
  sinalizados: number;
  atualizar: () => Promise<void>;
}

/** Contadores de pendencia exibidos como badge no menu lateral (CARD-16). */
export const usePendenciasStore = create<PendenciasState>((set) => ({
  contestacoes: 0,
  sinalizados: 0,
  atualizar: async () => {
    const [contestacoes, sinalizados] = await Promise.all([
      listarContestacoes(0, 1, 'PENDENTE'),
      listarSinalizados(0, 1),
    ]);
    set({
      contestacoes: contestacoes.totalElementos,
      sinalizados: sinalizados.totalElementos,
    });
  },
}));
