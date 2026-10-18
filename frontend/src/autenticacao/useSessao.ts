import { useContext } from 'react';
import { Contexto, type ContextoDeSessao } from '@/autenticacao/contexto';

export function useSessao(): ContextoDeSessao {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error('useSessao precisa estar dentro de ProvedorDeSessao.');
  }
  return contexto;
}
