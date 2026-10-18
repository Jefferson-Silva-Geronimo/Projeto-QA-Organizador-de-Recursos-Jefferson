import type { Perfil } from '@/sessao/armazenamento';

export interface Tela {
  id: string;
  caminho: string;
  rotulo: string;
  perfis: readonly Perfil[];
}

const TODOS: readonly Perfil[] = ['SOLICITANTE', 'RESPONSAVEL', 'ADMINISTRADOR'];

/**
 * As 11 telas e quem as vê, conforme a matriz de acesso de docs/prd/navegacao-telas.md (seção 3).
 * Esconder uma tela por perfil é conveniência de interface: quem decide o acesso é o servidor (ADR-004).
 */
export const TELAS: readonly Tela[] = [
  { id: 'T01', caminho: '/entrar', rotulo: 'Entrar', perfis: TODOS },
  { id: 'T02', caminho: '/buscar', rotulo: 'Buscar', perfis: TODOS },
  { id: 'T03', caminho: '/reservas/nova', rotulo: 'Nova reserva', perfis: ['SOLICITANTE', 'RESPONSAVEL'] },
  { id: 'T04', caminho: '/reservas', rotulo: 'Reservas', perfis: TODOS },
  { id: 'T05', caminho: '/aprovacoes', rotulo: 'Aprovações', perfis: ['RESPONSAVEL'] },
  { id: 'T06', caminho: '/retiradas', rotulo: 'Retiradas', perfis: ['RESPONSAVEL'] },
  { id: 'T07', caminho: '/catalogo', rotulo: 'Catálogo', perfis: TODOS },
  { id: 'T08', caminho: '/bloqueios', rotulo: 'Bloqueios', perfis: ['ADMINISTRADOR'] },
  { id: 'T09', caminho: '/auditoria', rotulo: 'Histórico', perfis: ['RESPONSAVEL', 'ADMINISTRADOR'] },
  { id: 'T10', caminho: '/relatorios', rotulo: 'Relatórios', perfis: ['RESPONSAVEL', 'ADMINISTRADOR'] },
  { id: 'T11', caminho: '/usuarios', rotulo: 'Usuários', perfis: ['ADMINISTRADOR'] },
];

/** Telas da navegação do perfil, na ordem da matriz. O login não faz parte da navegação. */
export function telasDoPerfil(perfil: Perfil): Tela[] {
  return TELAS.filter((t) => t.id !== 'T01' && t.perfis.includes(perfil));
}
