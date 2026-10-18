import type { Tela } from '@/rotas/telas';
import type { Perfil } from '@/sessao/armazenamento';

/** No celular a barra inferior mostra no máximo 4 telas; as demais vão para "Mais" (F6-08). */
export const MAXIMO_NA_BARRA = 4;

export interface BarraDoCelular {
  principais: Tela[];
  mais: Tela[];
}

export function distribuirNoCelular(telas: Tela[]): BarraDoCelular {
  return { principais: telas.slice(0, MAXIMO_NA_BARRA), mais: telas.slice(MAXIMO_NA_BARRA) };
}

const ROTA_INICIAL: Record<Perfil, string> = {
  SOLICITANTE: '/buscar',
  RESPONSAVEL: '/aprovacoes',
  ADMINISTRADOR: '/catalogo',
};

/** Tela em que cada perfil começa depois do login. É conveniência: nada aqui concede acesso. */
export function rotaInicial(perfil: Perfil): string {
  return ROTA_INICIAL[perfil];
}
