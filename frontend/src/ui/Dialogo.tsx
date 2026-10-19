import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
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
const CAMPOS = 'input:not(:disabled), textarea:not(:disabled), select:not(:disabled)';

/**
 * Diálogo modal (WCAG 2.1.2, 2.4.3, 4.1.2). O foco entra no primeiro campo (ou controle), o Tab fica preso dentro,
 * o Escape fecha e, ao fechar, o foco volta a quem abriu. A página de trás não rola enquanto ele está aberto.
 */
export function Dialogo({ titulo, descricao, aoFechar, ocupado = false, retorno, alternativa, children }: Props) {
  const idTitulo = useId();
  const idDescricao = useId();
  const caixa = useRef<HTMLDivElement>(null);
  // O teclado é ouvido uma vez só; o que ele precisa saber da hora vem daqui.
  const atual = useRef({ aoFechar, ocupado });
  useEffect(() => {
    atual.current = { aoFechar, ocupado };
  });

  useEffect(() => {
    const dialogo = caixa.current;
    if (!dialogo) {
      return;
    }
    const quemAbriu = retorno.current;
    const cartao = alternativa.current;
    (dialogo.querySelector<HTMLElement>(CAMPOS) ?? dialogo.querySelector<HTMLElement>(FOCAVEIS))?.focus();
    const rolagem = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        evento.stopPropagation();
        if (!atual.current.ocupado) {
          atual.current.aoFechar();
        }
        return;
      }
      if (evento.key !== 'Tab') {
        return;
      }
      // Pela ordem do documento, que é a ordem do Tab. Não confiar na ordem do seletor composto (o jsdom a agrupa).
      const focaveis = [...dialogo.querySelectorAll<HTMLElement>(FOCAVEIS)].sort((a, b) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
      );
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (!primeiro || !ultimo) {
        evento.preventDefault();
        return;
      }
      const ativo = document.activeElement;
      if (evento.shiftKey && (ativo === primeiro || ativo === dialogo || !dialogo.contains(ativo))) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && ativo === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    };
    dialogo.addEventListener('keydown', aoTeclar);

    return () => {
      dialogo.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = rolagem;
      (quemAbriu?.isConnected ? quemAbriu : cartao)?.focus();
    };
  }, [retorno, alternativa]);

  return createPortal(
    <div className={estilos.fundo}>
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={idDescricao}
        className={estilos.caixa}
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
