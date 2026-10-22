import type { components } from '@/api/schema';
import type { Recurso } from '@/test/recursos';
import { AULA_EXTRA, type Reserva } from '@/test/reservas';

export type Movimentacao = components['schemas']['MovimentacaoResposta'];

export const NOTEBOOK: Recurso = {
  id: 8,
  tipo: 'MATERIAL',
  nome: 'Notebook N-001',
  restrito: false,
  ativo: true,
  codigoPatrimonio: 'PAT-N001',
  descricao: 'Notebook com carregador',
};

/** Reserva APROVADA com a Sala 101, o Projetor e o Notebook, terça 20/10/2026 das 14:00 às 16:00 no campus. */
export const AULA_DE_INFORMATICA: Reserva = {
  ...AULA_EXTRA,
  id: 30,
  titulo: 'Aula de informática',
  recursoIds: [1, 7, 8],
  podeAlterar: false,
  podeCancelar: false,
  podeIniciar: true,
  podeConcluir: false,
  podeMarcarNaoComparecimento: false,
};

/** Retirada ou devolução. O campo `atual` vem do servidor: a tela não o calcula. */
export function movimento(
  id: number,
  materialId: number,
  tipo: 'RETIRADA' | 'DEVOLUCAO',
  atual: boolean,
  hora = '17:02',
  nome = 'Carlos Lima',
): Movimentacao {
  return {
    id,
    materialId,
    tipo,
    atual,
    registradoPorId: 9,
    registradoPorNome: nome,
    registradoEm: `2026-10-20T${hora}:00Z`,
  };
}
