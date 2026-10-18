import { Outlet } from 'react-router-dom';
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
        <main id="conteudo" tabIndex={-1} className={estilos.conteudo}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
