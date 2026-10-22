import type { components } from '@/api/schema';
import { PaginaDeUsuarios } from '@/paginas/usuarios/PaginaDeUsuarios';
import { montarPagina, resposta, rotearFetch } from '@/test/montar';

export type Usuario = components['schemas']['UsuarioResposta'];

export const ANA: Usuario = { id: 1, nome: 'Ana Prado', email: 'ana.prado@exemplo.test', perfil: 'ADMINISTRADOR', ativo: true };
export const CARLOS: Usuario = { id: 9, nome: 'Carlos Lima', email: 'carlos.lima@exemplo.test', perfil: 'RESPONSAVEL', ativo: true };
export const MARIA: Usuario = { id: 2, nome: 'Maria Souza', email: 'maria.souza@exemplo.test', perfil: 'SOLICITANTE', ativo: true };
export const JOAO: Usuario = { id: 4, nome: 'João Alves', email: 'joao.alves@exemplo.test', perfil: 'SOLICITANTE', ativo: false };

export const TODOS_OS_USUARIOS: Usuario[] = [ANA, CARLOS, MARIA, JOAO];

const IDS = [1, 2, 4, 9];

export interface EstadoDeUsuarios {
  usuarios: Usuario[];
  /** Pedidos de escrita recebidos, na ordem: rota e corpo. */
  chamadas: { rota: string; corpo: unknown }[];
}

export interface Cenario {
  usuarios?: Usuario[];
  /** Resposta a uma escrita. Pode mudar o estado do servidor antes de responder. Sem retorno, usa a resposta padrão. */
  responder?: (rota: string, corpo: unknown, estado: EstadoDeUsuarios) => Response | Promise<Response> | undefined;
  /** Resposta à consulta da lista. Sem retorno, devolve a lista do estado. */
  listar?: () => Response | Promise<Response>;
}

export const recusa = (status: number, code: string, extra: Record<string, unknown> = {}) =>
  resposta(status, { status, code, ...extra });

/** Monta a página como a aplicação a monta: com sessão de Administrador e a API simulada na fronteira do fetch. */
export function montarUsuarios({ usuarios = TODOS_OS_USUARIOS, responder, listar }: Cenario = {}) {
  // Cada teste muda os próprios usuários: copiar cada objeto evita contaminar as fixtures compartilhadas.
  const estado: EstadoDeUsuarios = { usuarios: usuarios.map((u) => ({ ...u })), chamadas: [] };
  let proximoId = 100;

  const escrever = (rota: string, padrao: (corpo: Record<string, unknown>) => Response) => async (pedido: Request) => {
    const texto = await pedido.text();
    const corpo = texto ? (JSON.parse(texto) as Record<string, unknown>) : {};
    estado.chamadas.push({ rota, corpo });
    return (await responder?.(rota, corpo, estado)) ?? padrao(corpo);
  };

  const rotas: Parameters<typeof rotearFetch>[0] = {
    'GET /api/usuarios': () => listar?.() ?? resposta(200, estado.usuarios),
    'POST /api/usuarios': escrever('criar', (corpo) => {
      const { senha: _senha, ...resto } = corpo;
      const criado = { id: proximoId++, ativo: true, ...resto } as unknown as Usuario;
      estado.usuarios.push(criado);
      return resposta(201, criado);
    }),
  };
  for (const id of IDS) {
    rotas[`PUT /api/usuarios/${id}/perfil`] = escrever(`perfil:${id}`, (corpo) => {
      const alvo = estado.usuarios.find((u) => u.id === id);
      if (alvo) alvo.perfil = corpo.perfil as Usuario['perfil'];
      return resposta(200, alvo);
    });
    rotas[`POST /api/usuarios/${id}/desativacao`] = escrever(`desativacao:${id}`, () => {
      const alvo = estado.usuarios.find((u) => u.id === id);
      if (alvo) alvo.ativo = false;
      return resposta(200, alvo);
    });
  }

  const falso = rotearFetch(rotas);
  const montada = montarPagina({
    rota: '/usuarios',
    caminho: '/usuarios',
    elemento: <PaginaDeUsuarios />,
    perfil: 'ADMINISTRADOR',
    fetch: falso,
  });
  return { estado, falso, ...montada };
}
