import { createContext } from 'react';
import type { criarCliente } from '@/api/cliente';
import type { Sessao } from '@/sessao/armazenamento';

export interface ContextoDeSessao {
  sessao: Sessao | null;
  /** Verdadeiro quando o servidor encerrou a sessão (401). Falso na abertura, ao entrar e ao sair por vontade própria. */
  sessaoExpirou: boolean;
  cliente: ReturnType<typeof criarCliente>;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
}

export const Contexto = createContext<ContextoDeSessao | null>(null);
