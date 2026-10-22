import type { components } from '@/api/schema';
import { PaginaDoCatalogo } from '@/paginas/catalogo/PaginaDoCatalogo';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';
import { LABORATORIO, PROFESSORA, PROJETOR, SALA_101, type Recurso } from '@/test/recursos';
import { NOTEBOOK } from '@/test/uso';
import type { Perfil } from '@/sessao/armazenamento';

export type Usuario = components['schemas']['UsuarioResposta'];

export const CARLOS: Usuario = { id: 9, nome: 'Carlos Lima', email: 'carlos.lima@exemplo.test', perfil: 'RESPONSAVEL', ativo: true };
export const MARIA: Usuario = { id: 2, nome: 'Maria Souza', email: 'maria.souza@exemplo.test', perfil: 'SOLICITANTE', ativo: true };

/** Recursos de teste de cada tipo: uma sala livre, um laboratório restrito, uma professora, dois materiais. */
export const TODOS_OS_RECURSOS: Recurso[] = [SALA_101, LABORATORIO, PROFESSORA, PROJETOR, NOTEBOOK];

const IDS = [1, 3, 5, 7, 8];

export interface EstadoDoCatalogo {
  recursos: Recurso[];
  /** Pedidos de escrita recebidos, na ordem: rota e corpo. */
  chamadas: { rota: string; corpo: unknown }[];
  /** Filtro `tipo` de cada consulta de recursos. */
  consultas: (string | null)[];
}

export interface Cenario {
  perfil?: Perfil;
  recursos?: Recurso[];
  usuarios?: Usuario[];
  /** Resposta a uma escrita. Pode mudar o estado do servidor antes de responder. Sem retorno, usa a resposta padrão. */
  responder?: (rota: string, corpo: unknown, estado: EstadoDoCatalogo) => Response | Promise<Response> | undefined;
}

export const recusa = (status: number, code: string, extra: Record<string, unknown> = {}) =>
  resposta(status, { status, code, ...extra });

/** Monta a página como a aplicação a monta: com sessão, consultas e a API simulada na fronteira do fetch. */
export function montarCatalogo({ perfil = 'ADMINISTRADOR', recursos = TODOS_OS_RECURSOS, usuarios = [CARLOS, MARIA], responder }: Cenario = {}) {
  // Cada teste muda os próprios recursos: copiar cada objeto evita contaminar as fixtures compartilhadas.
  const estado: EstadoDoCatalogo = { recursos: recursos.map((r) => ({ ...r })), chamadas: [], consultas: [] };
  let proximoId = 100;

  const escrever = (rota: string, padrao: (corpo: Record<string, unknown>) => Response) =>
    async (pedido: Request) => {
      const texto = await pedido.text();
      const corpo = texto ? (JSON.parse(texto) as Record<string, unknown>) : {};
      estado.chamadas.push({ rota, corpo });
      return (await responder?.(rota, corpo, estado)) ?? padrao(corpo);
    };

  const novoRecurso = (tipo: Recurso['tipo'], corpo: Record<string, unknown>): Recurso => {
    const criado = { id: proximoId++, tipo, restrito: false, ativo: true, ...corpo } as unknown as Recurso;
    estado.recursos.push(criado);
    return criado;
  };

  const rotas: Parameters<typeof rotearFetch>[0] = {
    'GET /api/recursos': (pedido) => {
      const tipo = new URL(pedido.url).searchParams.get('tipo');
      estado.consultas.push(tipo);
      return resposta(200, estado.recursos.filter((r) => !tipo || r.tipo === tipo));
    },
    'GET /api/usuarios': () => resposta(200, usuarios),
    'POST /api/salas': escrever('salas', (corpo) => resposta(201, novoRecurso('SALA', corpo))),
    'POST /api/professores': escrever('professores', (corpo) => resposta(201, novoRecurso('PROFESSOR', corpo))),
    'POST /api/materiais': escrever('materiais', (corpo) => resposta(201, novoRecurso('MATERIAL', corpo))),
  };
  for (const id of IDS) {
    rotas[`PUT /api/recursos/${id}/restrito`] = escrever(`restrito:${id}`, (corpo) => {
      const alvo = estado.recursos.find((r) => r.id === id);
      if (alvo) alvo.restrito = corpo.restrito === true;
      return resposta(200, alvo);
    });
    rotas[`POST /api/recursos/${id}/desativacao`] = escrever(`desativacao:${id}`, () => {
      const alvo = estado.recursos.find((r) => r.id === id);
      estado.recursos = estado.recursos.filter((r) => r.id !== id);
      return resposta(200, { ...alvo, ativo: false });
    });
  }

  const falso = rotearFetch(rotas);
  const montada = montarPagina({
    rota: '/catalogo',
    caminho: '/catalogo',
    elemento: <PaginaDoCatalogo />,
    perfil,
    fetch: falso,
  });
  return { estado, falso, ...montada };
}
