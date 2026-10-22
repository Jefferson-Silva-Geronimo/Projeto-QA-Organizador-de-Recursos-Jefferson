import { useEffect, useId, useRef, type ReactNode } from 'react';
import estilos from '@/paginas/busca/CartaoDeRecurso.module.css';
import estilosDoCatalogo from '@/paginas/catalogo/CartaoDoCatalogo.module.css';
import type { Recurso } from '@/recursos/consulta';
import { descreverDias } from '@/recursos/formatacao';
import { useAlterarRestrito } from '@/recursos/gestao';
import { Botao } from '@/ui/Botao';
import { ErroDaApi } from '@/ui/ErroDaApi';

function Detalhe({ nome, children }: { nome: string; children: ReactNode }) {
  return (
    <div className={estilos.detalhe}>
      <dt>{nome}</dt>
      <dd>{children}</dd>
    </div>
  );
}

interface Props {
  recurso: Recurso;
  /** Só o Administrador muda o catálogo (matriz de telas); o servidor recusa os outros com 403 (ADR-004). */
  administrador: boolean;
  /** Anuncia o resultado de uma mudança. */
  aoAnunciar: (texto: string) => void;
  /** Abre a confirmação de desativar. O botão que abriu vai junto, para o foco voltar a ele. */
  aoDesativar: (recurso: Recurso, botao: HTMLButtonElement) => void;
}

/**
 * Um recurso do catálogo (T07, RF-02). Mostra o que o servidor devolve. O Administrador marca ou desmarca "restrito"
 * (o que não muda as reservas que já existem) e pede a desativação; quem decide é o servidor.
 */
export function CartaoDoCatalogo({ recurso, administrador, aoAnunciar, aoDesativar }: Props) {
  const idTitulo = useId();
  const restrito = useAlterarRestrito(recurso.id);
  const alerta = useRef<HTMLDivElement>(null);

  // Depois de uma recusa o foco vai para a mensagem: o teclado e o leitor de tela vão até ela.
  useEffect(() => {
    if (restrito.isError) {
      alerta.current?.focus();
    }
  }, [restrito.isError, restrito.submittedAt]);

  const alterar = (novo: boolean) => {
    if (restrito.isPending) {
      return;
    }
    const resultado = novo ? `"${recurso.nome}" agora exige aprovação.` : `"${recurso.nome}" deixou de exigir aprovação.`;
    restrito.mutate(novo, { onSuccess: () => aoAnunciar(resultado) });
  };

  return (
    <article aria-labelledby={idTitulo} className={estilos.cartao}>
      <header className={estilos.cabecalho}>
        <h2 id={idTitulo} className={estilos.nome}>
          {recurso.nome}
        </h2>
      </header>
      <dl className={estilos.detalhes}>
        {recurso.capacidade !== undefined && <Detalhe nome="Capacidade">{recurso.capacidade} pessoas</Detalhe>}
        {recurso.localizacao && <Detalhe nome="Local">{recurso.localizacao}</Detalhe>}
        {recurso.horaAbertura && recurso.horaFechamento && (
          <Detalhe nome="Funcionamento">
            {recurso.horaAbertura} às {recurso.horaFechamento}
            {recurso.diasFuncionamento?.length ? `, ${descreverDias(recurso.diasFuncionamento)}` : ''}
          </Detalhe>
        )}
        {recurso.codigoPatrimonio && <Detalhe nome="Patrimônio">{recurso.codigoPatrimonio}</Detalhe>}
        {recurso.descricao && <Detalhe nome="Descrição">{recurso.descricao}</Detalhe>}
        {recurso.tipo === 'PROFESSOR' && (
          <Detalhe nome="Competências">
            <ul className={estilos.competencias}>
              {(recurso.competencias ?? []).map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Detalhe>
        )}
        {recurso.tipo === 'PROFESSOR' && (
          <Detalhe nome="Vínculo">{recurso.usuarioId === undefined ? 'Sem vínculo com usuário' : 'Com vínculo a um usuário'}</Detalhe>
        )}
      </dl>
      <p className={estilosDoCatalogo.restricao}>{recurso.restrito ? 'Exige aprovação' : 'Sem restrição'}</p>
      {restrito.isError && <ErroDaApi erro={restrito.error} ref={alerta} />}
      {administrador && (
        <div className={estilos.acoes}>
          <label className={estilosDoCatalogo.marcador}>
            <input
              type="checkbox"
              checked={recurso.restrito}
              disabled={restrito.isPending}
              onChange={(e) => alterar(e.target.checked)}
            />
            <span>
              Restrito <span className="somente-leitor">{recurso.nome}</span>
            </span>
          </label>
          <Botao variante="secundario" onClick={(e) => aoDesativar(recurso, e.currentTarget)}>
            Desativar <span className="somente-leitor">{recurso.nome}</span>
          </Botao>
        </div>
      )}
    </article>
  );
}
