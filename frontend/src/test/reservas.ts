import type { components } from '@/api/schema';

export type Reserva = components['schemas']['ReservaResposta'];

/** Reserva APROVADA da Sala 101, terça 20/10/2026 das 14:00 às 16:00 no campus (17:00 às 19:00 UTC). */
export const AULA_EXTRA: Reserva = {
  id: 10,
  solicitanteId: 2,
  titulo: 'Aula extra',
  descricao: 'Revisão para a prova.',
  inicio: '2026-10-20T17:00:00Z',
  fim: '2026-10-20T19:00:00Z',
  estado: 'APROVADA',
  exigeAprovacao: false,
  recursoIds: [1],
  podeAlterar: true,
  podeCancelar: true,
  podeIniciar: false,
  podeConcluir: false,
  podeMarcarNaoComparecimento: false,
};

/** Reserva SOLICITADA do Laboratório 3 e do Projetor, quinta 22/10/2026 das 08:00 às 10:00 no campus. */
export const PROVA: Reserva = {
  id: 11,
  solicitanteId: 2,
  titulo: 'Prova de Estatística',
  inicio: '2026-10-22T11:00:00Z',
  fim: '2026-10-22T13:00:00Z',
  estado: 'SOLICITADA',
  exigeAprovacao: true,
  recursoIds: [3, 7],
  podeAlterar: true,
  podeCancelar: true,
  podeIniciar: false,
  podeConcluir: false,
  podeMarcarNaoComparecimento: false,
};
