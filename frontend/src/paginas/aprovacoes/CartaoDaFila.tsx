import { useId } from 'react';
import type { ItemDaFila } from '@/aprovacoes/consulta';
import { FUSO_DO_CAMPUS, formatarIntervalo } from '@/datas/fuso';
import estilos from '@/paginas/reservas/CartaoDeReserva.module.css';
import { useRecursosDaReserva } from '@/reservas/consulta';

/** Nome do recurso, ou o número dele quando a consulta falhou: a solicitação continua legível. */
function NomesDosRecursos({ ids }: { ids: readonly number[] }) {
  const recursos = useRecursosDaReserva(ids);
  if (recursos.some((r) => r.carregando)) {
    return <span className={estilos.carregando}>Carregando recursos…</span>;
  }
  return <>{recursos.map((r) => r.recurso?.nome ?? `Recurso ${r.id}`).join(', ')}</>;
}

interface Props {
  item: ItemDaFila;
}

/**
 * Uma solicitação da fila. Mostra o nome de quem pediu, nunca o e-mail (L-04), e o que o servidor devolveu.
 * Reaproveita o estilo do cartão de reservas (F6-11).
 */
export function CartaoDaFila({ item }: Props) {
  const idTitulo = useId();
  return (
    <article aria-labelledby={idTitulo} className={estilos.cartao}>
      <header className={estilos.cabecalho}>
        <h2 id={idTitulo} className={estilos.titulo}>
          {item.titulo}
        </h2>
      </header>
      <dl className={estilos.detalhes}>
        <div className={estilos.detalhe}>
          <dt>Solicitante</dt>
          <dd>{item.solicitanteNome}</dd>
        </div>
        <div className={estilos.detalhe}>
          <dt>Quando</dt>
          <dd>{formatarIntervalo(item.inicio, item.fim, FUSO_DO_CAMPUS)}</dd>
        </div>
        <div className={estilos.detalhe}>
          <dt>Recursos</dt>
          <dd>
            <NomesDosRecursos ids={item.recursoIds} />
          </dd>
        </div>
      </dl>
    </article>
  );
}
