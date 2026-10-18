import { createContext } from 'react';
import type { criarCliente } from '@/api/cliente';
import type { Sessao } from '@/sessao/armazenamento';

export interface ContextoDeSessao {
  sessao: Sessao | null;
  cliente: ReturnType<typeof criarCliente>;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
}

export const Contexto = createContext<ContextoDeSessao | null>(null);
