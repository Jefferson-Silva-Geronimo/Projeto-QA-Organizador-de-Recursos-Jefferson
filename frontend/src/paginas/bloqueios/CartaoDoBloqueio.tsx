import { useId } from 'react';
import type { Bloqueio } from '@/bloqueios/consulta';
import { FUSO_DO_CAMPUS, formatarIntervalo } from '@/datas/fuso';
import estilosDoBloqueio from '@/paginas/bloqueios/CartaoDoBloqueio.module.css';
import estilos from '@/paginas/busca/CartaoDeRecurso.module.css';
import { Botao } from '@/ui/Botao';

interface Props {
  bloqueio: Bloqueio;
  /** Nome do recurso. Quando o recurso não está mais na lista, a tela mostra o número dele. */
  recurso: string;
  /** Abre o diálogo de levantar. O botão que abriu vai junto, para o foco voltar a ele. */
  aoLevantar: (bloqueio: Bloqueio, botao: HTMLButtonElement) => void;
}

function Detalhe({ nome, children }: { nome: string; children: string }) {
  return (
    <div className={estilos.detalhe}>
      <dt>{nome}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/**
 * Um bloqueio da lista (T08, RN-22). Só os ativos oferecem Levantar, que pede o motivo num diálogo. A lista do servidor
 * pode não trazer as reservas canceladas; quando traz, elas aparecem como vieram.
 */
export function CartaoDoBloqueio({ bloqueio, recurso, aoLevantar }: Props) {
  const idTitulo = useId();

  return (
    <article aria-labelledby={idTitulo} className={estilos.cartao}>
      <header className={estilos.cabecalho}>
        <h2 id={idTitulo} className={estilos.nome}>
          {recurso}
        </h2>
      </header>
      <dl className={estilos.detalhes}>
        <Detalhe nome="Período">{formatarIntervalo(bloqueio.inicio, bloqueio.fim, FUSO_DO_CAMPUS)}</Detalhe>
        <Detalhe nome="Motivo">{bloqueio.motivo}</Detalhe>
        <Detalhe nome="Situação">{bloqueio.ativo ? 'Ativo' : 'Levantado'}</Detalhe>
      </dl>
      {bloqueio.reservasCanceladas.length > 0 && (
        <p className={estilosDoBloqueio.canceladas}>Reservas canceladas: {bloqueio.reservasCanceladas.map((id) => `nº ${id}`).join(', ')}</p>
      )}
      {bloqueio.ativo && (
        <div className={estilos.acoes}>
          <Botao variante="secundario" onClick={(e) => aoLevantar(bloqueio, e.currentTarget)}>
            Levantar <span className="somente-leitor">bloqueio {recurso}</span>
          </Botao>
        </div>
      )}
    </article>
  );
}
