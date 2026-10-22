import { PaginaDeRetiradas } from '@/paginas/retiradas/PaginaDeRetiradas';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';
import { LABORATORIO, PROJETOR, SALA_101 } from '@/test/recursos';
import type { Reserva } from '@/test/reservas';
import { NOTEBOOK, type Movimentacao } from '@/test/uso';

const ACOES = ['inicio', 'retiradas', 'devolucoes', 'conclusao', 'nao-comparecimento'] as const;
const IDS = [30, 31, 32];

export interface EstadoDoServidor {
  reservas: Reserva[];
  movimentacoes: Record<number, Movimentacao[]>;
  /** Pedidos de registro recebidos, na ordem. */
  chamadas: { acao: string; reservaId: number; corpo: unknown }[];
  /** Quantas vezes a lista de reservas foi pedida. */
  listagens: number;
}

export interface Cenario {
  reservas: Reserva[];
  movimentacoes?: Record<number, Movimentacao[]>;
  /** Resposta à consulta das movimentações de uma reserva. Sem retorno, devolve o histórico do cenário. */
  consultarMovimentacoes?: (reservaId: number) => Response | undefined;
  /**
   * Resposta ao registro de uso. Pode mudar o estado do servidor antes de responder. Sem retorno, o servidor devolve
   * 200 com a reserva como está.
   */
  registrar?: (acao: string, reservaId: number, corpo: unknown, estado: EstadoDoServidor) => Response | Promise<Response> | undefined;
}

export const recusa = (status: number, code: string, extra: Record<string, unknown> = {}) =>
  resposta(status, { status, code, ...extra });

/** Monta a página como a aplicação a monta: Responsável logado e a API simulada na fronteira do fetch. */
export function montarRetiradas({ reservas, movimentacoes = {}, consultarMovimentacoes, registrar }: Cenario) {
  const estado: EstadoDoServidor = { reservas: [...reservas], movimentacoes: { ...movimentacoes }, chamadas: [], listagens: 0 };
  const rotas: Parameters<typeof rotearFetch>[0] = {
    'GET /api/reservas': () => {
      estado.listagens++;
      return resposta(200, estado.reservas);
    },
    'GET /api/recursos/1': () => resposta(200, SALA_101),
    'GET /api/recursos/3': () => resposta(200, LABORATORIO),
    'GET /api/recursos/7': () => resposta(200, PROJETOR),
    'GET /api/recursos/8': () => resposta(200, NOTEBOOK),
  };
  for (const id of IDS) {
    rotas[`GET /api/reservas/${id}/movimentacoes`] = () =>
      consultarMovimentacoes?.(id) ?? resposta(200, estado.movimentacoes[id] ?? []);
    for (const acao of ACOES) {
      rotas[`POST /api/reservas/${id}/${acao}`] = async (pedido) => {
        const texto = await pedido.text();
        const corpo = texto ? JSON.parse(texto) : undefined;
        estado.chamadas.push({ acao, reservaId: id, corpo });
        const personalizada = registrar?.(acao, id, corpo, estado);
        return personalizada ?? resposta(200, estado.reservas.find((r) => r.id === id));
      };
    }
  }
  const falso = rotearFetch(rotas);
  const montada = montarPagina({
    rota: '/retiradas',
    caminho: '/retiradas',
    elemento: <PaginaDeRetiradas />,
    perfil: 'RESPONSAVEL',
    fetch: falso,
  });
  return { estado, falso, ...montada };
}
