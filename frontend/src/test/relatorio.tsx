import { useLocation } from 'react-router-dom';
import type { components } from '@/api/schema';
import { PaginaDeRelatorios } from '@/paginas/relatorios/PaginaDeRelatorios';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';
import { LABORATORIO, PROFESSORA, PROJETOR, SALA_101, type Recurso } from '@/test/recursos';
import type { Perfil } from '@/sessao/armazenamento';

export type ItemDoRelatorio = components['schemas']['ItemRelatorioResposta'];

/** Sala com utilização calculada pelo servidor: 12,5 horas em 30 de funcionamento, 41,7%. */
export const SALA_NO_RELATORIO: ItemDoRelatorio = {
  recursoId: 1,
  nome: 'Sala 101',
  tipo: 'SALA',
  horasAlocadas: 12.5,
  utilizacao: 0.4167,
  conflitosEvitados: 3,
  solicitantesDistintos: 2,
};

/** Professor: o servidor não calcula utilização (RN-31), e o campo falta. */
export const PROFESSORA_NO_RELATORIO: ItemDoRelatorio = {
  recursoId: 5,
  nome: 'Profa. Helena Costa',
  tipo: 'PROFESSOR',
  horasAlocadas: 8,
  conflitosEvitados: 0,
  solicitantesDistintos: 1,
};

export const PROJETOR_NO_RELATORIO: ItemDoRelatorio = {
  recursoId: 7,
  nome: 'Projetor P-007',
  tipo: 'MATERIAL',
  horasAlocadas: 0.5,
  conflitosEvitados: 1,
  solicitantesDistintos: 1,
};

export const PERIODO = 'inicio=2026-10-20T08%3A00&fim=2026-10-27T18%3A00';

export interface EstadoDoRelatorio {
  /** Parâmetros de cada consulta do relatório, na ordem. */
  consultas: URLSearchParams[];
  /** Filtro `tipo` de cada consulta de recursos. */
  consultasDeRecursos: (string | null)[];
}

export interface Cenario {
  perfil?: Perfil;
  /** Endereço de entrada, com os filtros que já valem. */
  rota?: string;
  itens?: ItemDoRelatorio[];
  total?: number;
  recursos?: Recurso[];
  /** Resposta ao relatório. Sem retorno, devolve os itens do cenário. */
  responder?: (parametros: URLSearchParams) => Response | Promise<Response> | undefined;
}

function Endereco() {
  const local = useLocation();
  return <output aria-label="endereço atual">{local.pathname + local.search}</output>;
}

/** Monta a página como a aplicação a monta: com sessão, consultas e a API simulada na fronteira do fetch. */
export function montarRelatorios({
  perfil = 'RESPONSAVEL',
  rota = '/relatorios',
  itens = [SALA_NO_RELATORIO, PROFESSORA_NO_RELATORIO, PROJETOR_NO_RELATORIO],
  total,
  recursos = [SALA_101, LABORATORIO, PROFESSORA, PROJETOR],
  responder,
}: Cenario = {}) {
  const estado: EstadoDoRelatorio = { consultas: [], consultasDeRecursos: [] };
  const falso = rotearFetch({
    'GET /api/relatorios/utilizacao': async (pedido) => {
      const parametros = new URL(pedido.url).searchParams;
      estado.consultas.push(parametros);
      return (
        (await responder?.(parametros)) ??
        resposta(200, {
          itens,
          pagina: Number(parametros.get('pagina') ?? 0),
          tamanho: Number(parametros.get('tamanho')),
          total: total ?? itens.length,
        })
      );
    },
    'GET /api/recursos': (pedido) => {
      const tipo = new URL(pedido.url).searchParams.get('tipo');
      estado.consultasDeRecursos.push(tipo);
      return resposta(200, recursos.filter((r) => !tipo || r.tipo === tipo));
    },
  });
  const montada = montarPagina({
    rota,
    caminho: '/relatorios',
    elemento: (
      <>
        <PaginaDeRelatorios />
        <Endereco />
      </>
    ),
    perfil,
    fetch: falso,
  });
  return { estado, falso, ...montada };
}
