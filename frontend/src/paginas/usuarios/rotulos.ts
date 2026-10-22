import type { PerfilDoUsuario } from '@/usuarios/gestao';

export const ROTULO_DO_PERFIL: Record<PerfilDoUsuario, string> = {
  SOLICITANTE: 'Solicitante',
  RESPONSAVEL: 'Responsável',
  ADMINISTRADOR: 'Administrador',
};

export const PERFIS: readonly PerfilDoUsuario[] = ['SOLICITANTE', 'RESPONSAVEL', 'ADMINISTRADOR'];
