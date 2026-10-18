import type { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario';
  carregando?: boolean;
  textoCarregando?: string;
}

export function Botao(_props: Props) {
  return null;
}
