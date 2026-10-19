import { useId } from 'react';
import { FUSO_DO_CAMPUS, formatarIntervalo } from '@/datas/fuso';
import estilos from '@/paginas/reservas/CartaoDeReserva.module.css';
import { useRecursosDaReserva } from '@/reservas/consulta';
import type { Reserva } from '@/reservas/criar';
import { ROTULO_DO_ESTADO, textoDoMotivo } from '@/reservas/rotulos';

/** Nome do recurso, ou o número dele quando a consulta falhou: a reserva continua legível. */
function NomesDosRecursos({ ids }: { ids: readonly number[] }) {
  const recursos = useRecursosDaReserva(ids);
  if (recursos.some((r) => r.carregando)) {
    return <span className={estilos.carregando}>Carregando recursos…</span>;
  }
  return <>{recursos.map((r) => r.recurso?.nome ?? `Recurso ${r.id}`).join(', ')}</>;
}

/** Uma reserva. Mostra o que o servidor devolveu; não decide o que a pessoa pode fazer com ela. */
export function CartaoDeReserva({ reserva }: { reserva: Reserva }) {
  const idTitulo = useId();
  return (
    <article aria-labelledby={idTitulo} className={estilos.cartao}>
      <header className={estilos.cabecalho}>
        <h2 id={idTitulo} className={estilos.titulo}>
          {reserva.titulo}
        </h2>
        <span className={`${estilos.estado} ${estilos[reserva.estado]}`}>{ROTULO_DO_ESTADO[reserva.estado]}</span>
      </header>
      <dl className={estilos.detalhes}>
        <div className={estilos.detalhe}>
          <dt>Quando</dt>
          <dd>{formatarIntervalo(reserva.inicio, reserva.fim, FUSO_DO_CAMPUS)}</dd>
        </div>
        <div className={estilos.detalhe}>
          <dt>Recursos</dt>
          <dd>
            <NomesDosRecursos ids={reserva.recursoIds} />
          </dd>
        </div>
        {reserva.motivo && (
          <div className={estilos.detalhe}>
            <dt>Motivo</dt>
            <dd>{textoDoMotivo(reserva.motivo)}</dd>
          </div>
        )}
      </dl>
    </article>
  );
}
