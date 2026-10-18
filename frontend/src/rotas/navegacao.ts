import type { Tela } from '@/rotas/telas';
import type { Perfil } from '@/sessao/armazenamento';

export const MAXIMO_NA_BARRA = 4;

export interface BarraDoCelular {
  principais: Tela[];
  mais: Tela[];
}

export function distribuirNoCelular(_telas: Tela[]): BarraDoCelular {
  return { principais: [], mais: [] };
}

export function rotaInicial(_perfil: Perfil): string {
  return '';
}
