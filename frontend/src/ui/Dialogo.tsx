import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import estilos from '@/ui/Dialogo.module.css';

interface Props {
  titulo: string;
  /** Texto que o leitor de tela lê junto com o título. */
  descricao: ReactNode;
  /** Fecha o diálogo (Escape). Ignorado enquanto `ocupado`. */
  aoFechar: () => void;
  /** Há um envio em andamento: o Escape não fecha. */
  ocupado?: boolean;
  /** Onde o foco volta ao fechar. Se esse elemento já não existe, o foco vai para `alternativa`. */
  retorno: RefObject<HTMLElement | null>;
  alternativa: RefObject<HTMLElement | null>;
  children: ReactNode;
}

const FOCAVEIS = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)';

/**
 * Diálogo modal (WCAG 2.1.2, 2.4.3, 4.1.2). O foco entra no primeiro campo (ou controle), o Tab fica preso dentro,
 * o Escape fecha e, ao fechar, o foco volta a quem abriu. A página de trás não rola enquanto ele está aberto.
 */
export function Dialogo({ titulo, descricao, aoFechar, ocupado = false, retorno, alternativa, children }: Props) {
  const idTitulo = useId();
  const idDescricao = useId();
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const primeiro = caixa.current?.querySelector<HTMLElement>('input:not(:disabled), textarea:not(:disabled), select:not(:disabled)')
      ?? caixa.current?.querySelector<HTMLElement>(FOCAVEIS);
    primeiro?.focus();
    const rolagem = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = rolagem;
      const alvo = retorno.current?.isConnected ? retorno.current : alternativa.current;
      alvo?.focus();
    };
  }, [retorno, alternativa]);

  const aoTeclar = (evento: KeyboardEvent<HTMLDivElement>) => {
    if (evento.key === 'Escape') {
      evento.stopPropagation();
      if (!ocupado) {
        aoFechar();
      }
      return;
    }
    if (evento.key !== 'Tab' || !caixa.current) {
      return;
    }
    // Pela ordem do documento, que é a ordem do Tab. Não confiar na ordem do seletor composto (o jsdom a agrupa).
    const focaveis = [...caixa.current.querySelectorAll<HTMLElement>(FOCAVEIS)].sort((a, b) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    );
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    if (!primeiro || !ultimo) {
      evento.preventDefault();
      return;
    }
    const ativo = document.activeElement;
    if (evento.shiftKey && (ativo === primeiro || !caixa.current.contains(ativo) || ativo === caixa.current)) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && ativo === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  };

  return createPortal(
    <div className={estilos.fundo}>
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={idDescricao}
        className={estilos.caixa}
        onKeyDown={aoTeclar}
      >
        <h2 id={idTitulo} className={estilos.titulo}>
          {titulo}
        </h2>
        <p id={idDescricao} className={estilos.descricao}>
          {descricao}
        </p>
        {children}
      </div>
    </div>,
    document.body,
  );
}
