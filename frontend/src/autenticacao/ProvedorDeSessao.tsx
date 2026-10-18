import { useMemo, type ReactNode } from 'react';
import { criarCliente } from '@/api/cliente';
import { Contexto } from '@/autenticacao/contexto';

interface Props {
  baseUrl: string;
  fetch?: typeof fetch;
  children: ReactNode;
}

export function ProvedorDeSessao({ baseUrl, fetch: fetchFalso, children }: Props) {
  const valor = useMemo(
    () => ({
      sessao: null,
      cliente: criarCliente({ baseUrl, fetch: fetchFalso }),
      entrar: async () => {},
      sair: async () => {},
    }),
    [baseUrl, fetchFalso],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
