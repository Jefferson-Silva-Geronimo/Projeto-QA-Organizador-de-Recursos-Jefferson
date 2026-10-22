import { useId } from 'react';
import estilos from '@/paginas/busca/CartaoDeRecurso.module.css';
import { ROTULO_DO_PERFIL } from '@/paginas/usuarios/rotulos';
import type { Usuario } from '@/usuarios/consulta';
import { Botao } from '@/ui/Botao';

interface Props {
  usuario: Usuario;
  /** Abre o diálogo de trocar o perfil. O botão que abriu vai junto, para o foco voltar a ele. */
  aoTrocarPerfil: (usuario: Usuario, botao: HTMLButtonElement) => void;
  /** Abre a confirmação de desativar. */
  aoDesativar: (usuario: Usuario, botao: HTMLButtonElement) => void;
}

/**
 * Um usuário da lista (T11, RF-15): nome, e-mail, perfil e situação. A senha nunca vem do servidor nem aparece. O
 * usuário desativado não tem ações: desativar não tem volta, e o servidor é quem recusa o que não pode.
 */
export function CartaoDoUsuario({ usuario, aoTrocarPerfil, aoDesativar }: Props) {
  const idTitulo = useId();

  return (
    <article aria-labelledby={idTitulo} className={estilos.cartao}>
      <header className={estilos.cabecalho}>
        <h2 id={idTitulo} className={estilos.nome}>
          {usuario.nome}
        </h2>
      </header>
      <dl className={estilos.detalhes}>
        <div className={estilos.detalhe}>
          <dt>E-mail</dt>
          <dd>{usuario.email}</dd>
        </div>
        <div className={estilos.detalhe}>
          <dt>Perfil</dt>
          <dd>{ROTULO_DO_PERFIL[usuario.perfil]}</dd>
        </div>
        <div className={estilos.detalhe}>
          <dt>Situação</dt>
          <dd>{usuario.ativo ? 'Ativo' : 'Desativado'}</dd>
        </div>
      </dl>
      {usuario.ativo && (
        <div className={estilos.acoes}>
          <Botao variante="secundario" onClick={(e) => aoTrocarPerfil(usuario, e.currentTarget)}>
            Trocar perfil <span className="somente-leitor">{usuario.nome}</span>
          </Botao>
          <Botao variante="secundario" onClick={(e) => aoDesativar(usuario, e.currentTarget)}>
            Desativar <span className="somente-leitor">{usuario.nome}</span>
          </Botao>
        </div>
      )}
    </article>
  );
}
