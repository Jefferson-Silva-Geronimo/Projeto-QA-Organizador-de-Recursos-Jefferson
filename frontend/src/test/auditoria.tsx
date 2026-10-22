import { useLocation } from 'react-router-dom';
import type { components } from '@/api/schema';
import { PaginaDeAuditoria } from '@/paginas/auditoria/PaginaDeAuditoria';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';
import type { Perfil } from '@/sessao/armazenamento';

export type Evento = components['schemas']['EventoAuditoriaResposta'];

/** 20/10/2026 às 11:00 no campus (14:00 UTC): a Solicitante cria a reserva 41. */
export const CRIADA: Evento = {
  id: 1,
  ocorridoEm: '2026-10-20T14:00:00Z',
  atorTipo: 'USUARIO',
  atorId: 2,
  atorNome: 'Maria Souza',
  entidade: 'RESERVA',
  entidadeId: 41,
  acao: 'RESERVA_CRIADA',
  estadoNovo: 'SOLICITADA',
};

/** 21/10/2026 às 10:30 no campus (13:30 UTC): o Responsável aprova. */
export const APROVADA: Evento = {
  id: 2,
  ocorridoEm: '2026-10-21T13:30:00Z',
  atorTipo: 'USUARIO',
  atorId: 9,
  atorNome: 'Carlos Lima',
  entidade: 'RESERVA',
  entidadeId: 41,
  acao: 'RESERVA_APROVADA',
  estadoAnterior: 'SOLICITADA',
  estadoNovo: 'APROVADA',
};

/** 24/10/2026 às 22:00 no campus (01:00 UTC do dia 25): o sistema cancela por manutenção. Sem nome (L-10). */
export const CANCELADA_PELO_SISTEMA: Evento = {
  id: 3,
  ocorridoEm: '2026-10-25T01:00:00Z',
  atorTipo: 'SISTEMA',
  entidade: 'RESERVA',
  entidadeId: 41,
  acao: 'RESERVA_CANCELADA',
  estadoAnterior: 'APROVADA',
  estadoNovo: 'CANCELADA',
  motivo: 'MANUTENCAO',
};

/** 18/10/2026 às 09:00 no campus: a Administradora cadastra um usuário. O e-mail só existe em `depois`. */
export const USUARIO_CADASTRADO: Evento = {
  id: 4,
  ocorridoEm: '2026-10-18T12:00:00Z',
  atorTipo: 'USUARIO',
  atorId: 1,
  atorNome: 'Ana Prado',
  entidade: 'USUARIO',
  entidadeId: 9,
  acao: 'USUARIO_CRIADO',
  depois: { nome: 'Carlos Lima', email: 'carlos.lima@exemplo.test', perfil: 'RESPONSAVEL' },
};

/** Ação que a tela não conhece: aparece pelo código, em vez de sumir. */
export const ACAO_DESCONHECIDA: Evento = {
  id: 5,
  ocorridoEm: '2026-10-22T15:00:00Z',
  atorTipo: 'USUARIO',
  atorId: 2,
  atorNome: 'Maria Souza',
  entidade: 'RESERVA',
  entidadeId: 41,
  acao: 'RESERVA_TELEPORTADA',
};

export const HISTORICO_DA_RESERVA_41: Evento[] = [CRIADA, APROVADA, CANCELADA_PELO_SISTEMA];
export const TODOS_OS_EVENTOS: Evento[] = [USUARIO_CADASTRADO, CRIADA, APROVADA, CANCELADA_PELO_SISTEMA];

export interface EstadoDaAuditoria {
  /** Parâmetros de cada consulta da auditoria completa, na ordem. */
  consultasDaAuditoria: URLSearchParams[];
  /** Número da reserva de cada consulta de histórico, na ordem. */
  consultasDeHistorico: string[];
}

export interface Cenario {
  perfil?: Perfil;
  /** Eventos da auditoria completa; a consulta filtra por `entidade` e `entidadeId`, como o servidor. */
  eventos?: Evento[];
  /** Eventos de cada reserva, por número. Reserva que não está aqui responde 404. */
  historicos?: Record<string, Evento[]>;
  /** Resposta à consulta. Sem retorno, usa a lista do cenário. */
  responder?: (rota: 'auditoria' | 'historico', estado: EstadoDaAuditoria) => Response | Promise<Response> | undefined;
}

export const recusa = (status: number, code: string, extra: Record<string, unknown> = {}) =>
  resposta(status, { status, code, ...extra });

function Endereco() {
  const local = useLocation();
  return <output aria-label="endereço atual">{local.pathname + local.search}</output>;
}

/** Monta a página como a aplicação a monta: com sessão, consultas e a API simulada na fronteira do fetch. */
export function montarAuditoria({
  perfil = 'ADMINISTRADOR',
  eventos = TODOS_OS_EVENTOS,
  historicos = { '41': HISTORICO_DA_RESERVA_41 },
  responder,
  rota = '/auditoria',
}: Cenario & { rota?: string } = {}) {
  const estado: EstadoDaAuditoria = { consultasDaAuditoria: [], consultasDeHistorico: [] };

  const rotas: Parameters<typeof rotearFetch>[0] = {
    'GET /api/auditoria': async (pedido) => {
      const params = new URL(pedido.url).searchParams;
      estado.consultasDaAuditoria.push(params);
      const dada = await responder?.('auditoria', estado);
      if (dada) return dada;
      const entidade = params.get('entidade');
      const entidadeId = params.get('entidadeId');
      return resposta(
        200,
        eventos.filter((e) => (!entidade || e.entidade === entidade) && (!entidadeId || String(e.entidadeId) === entidadeId)),
      );
    },
  };
  for (const numero of ['41', '99']) {
    rotas[`GET /api/reservas/${numero}/historico`] = async () => {
      estado.consultasDeHistorico.push(numero);
      const dada = await responder?.('historico', estado);
      if (dada) return dada;
      const lista = historicos[numero];
      return lista ? resposta(200, lista) : recusa(404, 'NAO_ENCONTRADO');
    };
  }

  const falso = rotearFetch(rotas);
  const montada = montarPagina({
    rota,
    caminho: '/auditoria',
    elemento: (
      <>
        <PaginaDeAuditoria />
        <Endereco />
      </>
    ),
    perfil,
    fetch: falso,
  });
  return { estado, falso, ...montada };
}
