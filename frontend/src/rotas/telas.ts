import type { Perfil } from '@/sessao/armazenamento';

export interface Tela {
  id: string;
  caminho: string;
  rotulo: string;
  perfis: readonly Perfil[];
}

export const TELAS: readonly Tela[] = [];

export function telasDoPerfil(_perfil: Perfil): Tela[] {
  return [];
}
