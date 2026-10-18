import type { ButtonHTMLAttributes } from 'react';
import estilos from '@/ui/Botao.module.css';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario';
  carregando?: boolean;
  textoCarregando?: string;
}

/** Botão com área de toque de 44 px. Enquanto envia fica ocupado e ignora cliques, para não duplicar o envio. */
export function Botao({
  variante = 'primario',
  carregando = false,
  textoCarregando = 'Enviando…',
  type = 'button',
  className,
  children,
  disabled,
  ...resto
}: Props) {
  return (
    <button
      {...resto}
      type={type}
      className={`${estilos.botao} ${estilos[variante]} ${className ?? ''}`.trim()}
      disabled={disabled || carregando}
      aria-busy={carregando ? true : undefined}
    >
      {carregando ? textoCarregando : children}
    </button>
  );
}
