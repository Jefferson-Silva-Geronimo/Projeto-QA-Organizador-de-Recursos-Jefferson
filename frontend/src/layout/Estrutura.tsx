import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSessao } from '@/autenticacao/useSessao';
import estilos from '@/layout/Estrutura.module.css';
import { Navegacao } from '@/layout/Navegacao';
import { SeletorDeTema } from '@/layout/SeletorDeTema';
import { telasDoPerfil } from '@/rotas/telas';

const NOMES_DOS_PERFIS = {
  SOLICITANTE: 'Solicitante',
  RESPONSAVEL: 'Responsável',
  ADMINISTRADOR: 'Administrador',
} as const;

/** Casca das telas autenticadas: cabeçalho, menu lateral ou barra do celular, e o conteúdo da rota. */
export function Estrutura() {
  const { sessao, sair } = useSessao();
  const { pathname } = useLocation();
  const conteudo = useRef<HTMLElement>(null);
  const telaAnterior = useRef(pathname);

  // Numa aplicação de página única o navegador não move o foco ao trocar de tela. Sem isto o teclado fica
  // no corpo da página. Só muda de tela quando o caminho muda: filtros no endereço não movem o foco (WCAG 2.4.3).
  useEffect(() => {
    if (telaAnterior.current !== pathname) {
      telaAnterior.current = pathname;
      conteudo.current?.focus();
    }
  }, [pathname]);

  if (!sessao) {
    return null;
  }
  return (
    <div className={estilos.casca}>
      <a className={estilos.saltar} href="#conteudo">
        Pular para o conteúdo
      </a>
      <Navegacao telas={telasDoPerfil(sessao.perfil)} />
      <div className={estilos.coluna}>
        <header className={estilos.cabecalho}>
          <div className={estilos.marca}>
            <span className={estilos.nome}>Organização de Recursos</span>
            <span className={estilos.perfil}>{NOMES_DOS_PERFIS[sessao.perfil]}</span>
          </div>
          <div className={estilos.acoes}>
            <SeletorDeTema />
            <button type="button" className={estilos.sair} onClick={() => void sair()}>
              Sair
            </button>
          </div>
        </header>
        <main id="conteudo" ref={conteudo} tabIndex={-1} className={estilos.conteudo}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
