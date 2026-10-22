import type { components } from '@/api/schema';

export type ItemDaFila = components['schemas']['ReservaDaFilaResposta'];

/** Solicitação do Laboratório 3 e do Projetor, quinta 22/10/2026 das 08:00 às 10:00 no campus, com as duas decisões abertas. */
export const PEDIDO_DE_MARIA: ItemDaFila = {
  id: 21,
  solicitanteId: 2,
  solicitanteNome: 'Maria Souza',
  titulo: 'Prova de Estatística',
  inicio: '2026-10-22T11:00:00Z',
  fim: '2026-10-22T13:00:00Z',
  estado: 'SOLICITADA',
  exigeAprovacao: true,
  recursoIds: [3, 7],
  podeAprovar: true,
  podeRejeitar: true,
};

/** Segunda solicitação, de outra pessoa, para conferir a ordem e o isolamento entre cartões. */
export const PEDIDO_DE_JOAO: ItemDaFila = {
  id: 22,
  solicitanteId: 3,
  solicitanteNome: 'João Lima',
  titulo: 'Oficina de robótica',
  inicio: '2026-10-23T17:00:00Z',
  fim: '2026-10-23T19:00:00Z',
  estado: 'SOLICITADA',
  exigeAprovacao: true,
  recursoIds: [7],
  podeAprovar: true,
  podeRejeitar: true,
};
