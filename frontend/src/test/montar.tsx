import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { ProvedorDeSessao } from '@/autenticacao/ProvedorDeSessao';
import { guardarSessao, type Perfil } from '@/sessao/armazenamento';

export const BASE_DA_API = 'http://api.teste';

export function resposta(status: number, corpo?: unknown): Response {
  return corpo === undefined
    ? new Response(null, { status })
    : new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });
}

type Rota = (pedido: Request) => Response | Promise<Response>;

/** `fetch` falso que responde por "METODO /caminho". Rota que não existe falha o teste, não devolve 404 em silêncio. */
export function rotearFetch(rotas: Record<string, Rota>) {
  return vi.fn(async (entrada: RequestInfo | URL) => {
    const pedido = entrada as Request;
    const chave = `${pedido.method} ${new URL(pedido.url).pathname}`;
    const rota = rotas[chave];
    if (!rota) {
      throw new Error(`Rota sem resposta no teste: ${chave}`);
    }
    return rota(pedido);
  });
}

interface Opcoes {
  rota: string;
  caminho: string;
  elemento: ReactNode;
  perfil?: Perfil;
  fetch: typeof fetch;
  /** Rotas extras (por exemplo, a tela para onde a página navega). */
  outras?: ReactNode;
}

/** Monta uma página como a aplicação a monta: com sessão, consultas, roteador e a API simulada na fronteira do fetch. */
export function montarPagina({ rota, caminho, elemento, perfil = 'SOLICITANTE', fetch: fetchFalso, outras }: Opcoes) {
  guardarSessao({ token: 'token-de-teste', perfil, expiraEm: '2999-01-01T00:00:00Z' });
  const consultas = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(
    <QueryClientProvider client={consultas}>
      <ProvedorDeSessao baseUrl={BASE_DA_API} fetch={fetchFalso}>
        <MemoryRouter initialEntries={[rota]}>
          <Routes>
            <Route path={caminho} element={elemento} />
            {outras}
          </Routes>
        </MemoryRouter>
      </ProvedorDeSessao>
    </QueryClientProvider>,
  );
}
