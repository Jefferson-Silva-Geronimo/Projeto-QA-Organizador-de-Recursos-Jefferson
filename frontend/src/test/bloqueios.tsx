import type { components } from '@/api/schema';
import { PaginaDeBloqueios } from '@/paginas/bloqueios/PaginaDeBloqueios';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';
import { LABORATORIO, PROFESSORA, PROJETOR, SALA_101, type Recurso } from '@/test/recursos';

export type Bloqueio = components['schemas']['BloqueioResposta'];

/** 10/11/2026 das 08:00 às 18:00 no campus (11:00 e 21:00 UTC): bloqueio ativo da Sala 101. */
export const ATIVO: Bloqueio = {
  id: 5,
  recursoId: 1,
  inicio: '2026-11-10T11:00:00Z',
  fim: '2026-11-10T21:00:00Z',
  motivo: 'Pintura da sala',
  ativo: true,
  reservasCanceladas: [],
};

/** Bloqueio já levantado do laboratório: aparece na lista, sem ação. */
export const LEVANTADO: Bloqueio = {
  id: 4,
  recursoId: 3,
  inicio: '2026-11-03T11:00:00Z',
  fim: '2026-11-03T21:00:00Z',
  motivo: 'Troca dos computadores',
  ativo: false,
  reservasCanceladas: [],
};

/** Bloqueio ativo que cancelou duas reservas quando foi criado. */
export const COM_CANCELADAS: Bloqueio = {
  id: 6,
  recursoId: 7,
  inicio: '2026-11-12T11:00:00Z',
  fim: '2026-11-12T21:00:00Z',
  motivo: 'Manutenção do projetor',
  ativo: true,
  reservasCanceladas: [41, 44],
};

export const TODOS_OS_BLOQUEIOS: Bloqueio[] = [LEVANTADO, ATIVO, COM_CANCELADAS];

export interface EstadoDosBloqueios {
  bloqueios: Bloqueio[];
  /** Pedidos de escrita recebidos, na ordem: rota e corpo. */
  chamadas: { rota: string; corpo: Record<string, unknown> }[];
}

export interface Cenario {
  bloqueios?: Bloqueio[];
  recursos?: Recurso[];
  /** Resposta a uma escrita. Pode mudar o estado do servidor antes de responder. Sem retorno, usa a resposta padrão. */
  responder?: (rota: string, corpo: Record<string, unknown>, estado: EstadoDosBloqueios) => Response | Promise<Response> | undefined;
  /** Resposta à consulta da lista. Sem retorno, devolve a lista do estado. */
  listar?: () => Response | Promise<Response>;
}

export const recusa = (status: number, code: string, extra: Record<string, unknown> = {}) =>
  resposta(status, { status, code, ...extra });

const IDS = [4, 5, 6];

/** Monta a página como a aplicação a monta: com sessão de Administrador e a API simulada na fronteira do fetch. */
export function montarBloqueios({
  bloqueios = TODOS_OS_BLOQUEIOS,
  recursos = [SALA_101, LABORATORIO, PROFESSORA, PROJETOR],
  responder,
  listar,
}: Cenario = {}) {
  // Cada teste muda os próprios bloqueios: copiar cada objeto evita contaminar as fixtures compartilhadas.
  const estado: EstadoDosBloqueios = { bloqueios: bloqueios.map((b) => ({ ...b })), chamadas: [] };
  let proximoId = 100;

  const escrever = (rota: string, padrao: (corpo: Record<string, unknown>) => Response) => async (pedido: Request) => {
    const texto = await pedido.text();
    const corpo = texto ? (JSON.parse(texto) as Record<string, unknown>) : {};
    estado.chamadas.push({ rota, corpo });
    return (await responder?.(rota, corpo, estado)) ?? padrao(corpo);
  };

  const rotas: Parameters<typeof rotearFetch>[0] = {
    'GET /api/bloqueios': () => listar?.() ?? resposta(200, estado.bloqueios),
    'GET /api/recursos': () => resposta(200, recursos),
    'POST /api/bloqueios': escrever('criar', (corpo) => {
      const criado = {
        id: proximoId++,
        ativo: true,
        motivo: '',
        reservasCanceladas: (corpo.reservasConfirmadas as number[] | undefined) ?? [],
        ...corpo,
      } as unknown as Bloqueio;
      estado.bloqueios.push(criado);
      return resposta(201, criado);
    }),
  };
  for (const id of IDS) {
    rotas[`POST /api/bloqueios/${id}/levantamento`] = escrever(`levantamento:${id}`, () => {
      const alvo = estado.bloqueios.find((b) => b.id === id);
      if (alvo) alvo.ativo = false;
      return resposta(200, alvo);
    });
  }

  const falso = rotearFetch(rotas);
  const montada = montarPagina({
    rota: '/bloqueios',
    caminho: '/bloqueios',
    elemento: <PaginaDeBloqueios />,
    perfil: 'ADMINISTRADOR',
    fetch: falso,
  });
  return { estado, falso, ...montada };
}
