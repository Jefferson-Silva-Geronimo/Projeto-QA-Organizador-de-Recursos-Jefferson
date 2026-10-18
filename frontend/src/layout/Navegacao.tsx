import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icone } from '@/layout/Icone';
import estilos from '@/layout/Navegacao.module.css';
import { distribuirNoCelular } from '@/rotas/navegacao';
import type { Tela } from '@/rotas/telas';

interface Props {
  telas: Tela[];
}

/** A tela atual é a de caminho mais longo que casa com a rota (ex.: /reservas/nova casa com Nova reserva). */
function caminhoAtivo(telas: Tela[], rota: string): string | undefined {
  return telas
    .map((t) => t.caminho)
    .filter((c) => rota === c || rota.startsWith(`${c}/`))
    .sort((a, b) => b.length - a.length)[0];
}

/**
 * Menu lateral no desktop e barra inferior no celular (F6-08). Todo item tem rótulo de texto ao lado do ícone,
 * a tela atual se destaca por indicador e peso da fonte (não só por cor) e tudo funciona por teclado.
 */
export function Navegacao({ telas }: Props) {
  const { pathname } = useLocation();
  const { principais, mais } = distribuirNoCelular(telas);
  const ativo = caminhoAtivo(telas, pathname);
  const [aberto, setAberto] = useState(false);
  const botao = useRef<HTMLButtonElement>(null);
  const painel = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!aberto) {
      return;
    }
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAberto(false);
        botao.current?.focus();
      }
    };
    const aoClicarFora = (e: PointerEvent) => {
      const alvo = e.target as Node;
      if (!painel.current?.contains(alvo) && !botao.current?.contains(alvo)) {
        setAberto(false);
      }
    };
    document.addEventListener('keydown', aoTeclar);
    document.addEventListener('pointerdown', aoClicarFora);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.removeEventListener('pointerdown', aoClicarFora);
    };
  }, [aberto]);

  const item = (t: Tela, aoEscolher?: () => void) => (
    <li key={t.id}>
      <Link
        to={t.caminho}
        className={estilos.item}
        aria-current={t.caminho === ativo ? 'page' : undefined}
        onClick={aoEscolher}
      >
        <Icone nome={t.id} />
        <span>{t.rotulo}</span>
      </Link>
    </li>
  );

  const atualEmMais = mais.some((t) => t.caminho === ativo);

  return (
    <>
      <nav aria-label="Menu principal" className={estilos.lateral}>
        <ul className={estilos.lista}>{telas.map((t) => item(t))}</ul>
      </nav>

      <nav aria-label="Menu principal (celular)" className={estilos.barra}>
        <ul className={estilos.listaDaBarra}>
          {principais.map((t) => item(t))}
          {mais.length > 0 && (
            <li>
              <button
                ref={botao}
                type="button"
                className={estilos.item}
                aria-expanded={aberto}
                aria-controls="mais-telas"
                aria-current={atualEmMais ? 'true' : undefined}
                onClick={() => setAberto((a) => !a)}
              >
                <Icone nome="MAIS" />
                <span>Mais</span>
              </button>
            </li>
          )}
        </ul>
        {aberto && (
          <ul ref={painel} id="mais-telas" aria-label="Mais telas" className={estilos.painelMais}>
            {mais.map((t) => item(t, () => setAberto(false)))}
          </ul>
        )}
      </nav>
    </>
  );
}
