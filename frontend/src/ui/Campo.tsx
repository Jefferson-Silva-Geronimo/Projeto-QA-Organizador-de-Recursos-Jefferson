import type { ReactNode } from 'react';

export interface PropsDoControle {
  id: string;
  required?: boolean;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
}

interface Props {
  rotulo: string;
  erro?: string;
  ajuda?: string;
  obrigatorio?: boolean;
  children: (controle: PropsDoControle) => ReactNode;
}

export function Campo(_props: Props) {
  return null;
}
