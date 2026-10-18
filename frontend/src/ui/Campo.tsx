import { useId, type ReactNode } from 'react';
import estilos from '@/ui/Campo.module.css';

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

/**
 * Rótulo, ajuda e erro ligados ao controle (WCAG 1.3.1, 3.3.1 e 3.3.2). O rótulo é sempre visível e o "obrigatório"
 * é dito em texto, não só por asterisco. O erro entra na descrição do controle e o marca como inválido.
 */
export function Campo({ rotulo, erro, ajuda, obrigatorio, children }: Props) {
  const id = useId();
  const idAjuda = `${id}-ajuda`;
  const idErro = `${id}-erro`;
  const descricao = [ajuda ? idAjuda : '', erro ? idErro : ''].filter(Boolean).join(' ');

  return (
    <div className={estilos.campo}>
      <label htmlFor={id} className={estilos.rotulo}>
        {rotulo}
        {obrigatorio && <span className={estilos.obrigatorio}> (obrigatório)</span>}
      </label>
      {ajuda && (
        <p id={idAjuda} className={estilos.ajuda}>
          {ajuda}
        </p>
      )}
      {children({
        id,
        ...(obrigatorio ? { required: true } : {}),
        ...(erro ? { 'aria-invalid': true as const } : {}),
        ...(descricao ? { 'aria-describedby': descricao } : {}),
      })}
      {erro && (
        <p id={idErro} className={estilos.erro}>
          {erro}
        </p>
      )}
    </div>
  );
}
