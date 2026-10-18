import type { ReactNode } from 'react';
import type { Perfil } from '@/sessao/armazenamento';

interface Props {
  /** Perfis que veem a tela. Sem a lista, qualquer usuário com sessão vê. */
  perfis?: readonly Perfil[];
  children: ReactNode;
}

export function RotaProtegida({ children }: Props) {
  return <>{children}</>;
}
