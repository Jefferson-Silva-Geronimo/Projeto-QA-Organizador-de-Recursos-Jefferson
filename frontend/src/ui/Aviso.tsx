import type { ReactNode, Ref } from 'react';

export type TipoDeAviso = 'erro' | 'sucesso' | 'atencao' | 'info';

interface Props {
  tipo: TipoDeAviso;
  titulo?: string;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

export function Aviso(_props: Props) {
  return null;
}
