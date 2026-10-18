import type { ReactNode, Ref } from 'react';
import estilos from '@/ui/Aviso.module.css';

export type TipoDeAviso = 'erro' | 'sucesso' | 'atencao' | 'info';

interface Props {
  tipo: TipoDeAviso;
  titulo?: string;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

const ROTULOS: Record<TipoDeAviso, string> = {
  erro: 'Erro',
  atencao: 'Atenção',
  sucesso: 'Sucesso',
  info: 'Informação',
};

const GLIFOS: Record<TipoDeAviso, string> = { erro: '✕', atencao: '!', sucesso: '✓', info: 'i' };

/**
 * Mensagem da interface. Erro e atenção usam role="alert" (anunciados na hora); sucesso e informação, role="status".
 * O rótulo em texto fica só para leitor de tela: a informação nunca depende apenas da cor (WCAG 1.4.1).
 * O foco por código (tabIndex -1) leva o teclado até a mensagem depois de uma recusa do servidor.
 */
export function Aviso({ tipo, titulo, children, ref }: Props) {
  const papel = tipo === 'erro' || tipo === 'atencao' ? 'alert' : 'status';
  return (
    <div ref={ref} role={papel} tabIndex={-1} className={`${estilos.aviso} ${estilos[tipo]}`}>
      <span className={estilos.glifo} aria-hidden="true">
        {GLIFOS[tipo]}
      </span>
      <div className={estilos.texto}>
        <span className={estilos.somenteLeitor}>{ROTULOS[tipo]}: </span>
        {titulo && <strong className={estilos.titulo}>{titulo}</strong>}
        {children}
      </div>
    </div>
  );
}
