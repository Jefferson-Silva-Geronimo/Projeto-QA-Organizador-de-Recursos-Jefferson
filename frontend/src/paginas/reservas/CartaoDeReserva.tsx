import { useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FUSO_DO_CAMPUS, formatarIntervalo } from '@/datas/fuso';
import estilos from '@/paginas/reservas/CartaoDeReserva.module.css';
import { useSessao } from '@/autenticacao/useSessao';
import { DialogoDeCancelamento } from '@/paginas/reservas/DialogoDeCancelamento';
import { useRecursosDaReserva } from '@/reservas/consulta';
import type { Reserva } from '@/reservas/criar';
import { ROTULO_DO_ESTADO, textoDoMotivo } from '@/reservas/rotulos';
import { TELAS } from '@/rotas/telas';
import { Botao } from '@/ui/Botao';
import botoes from '@/ui/Botao.module.css';

/** Nome do recurso, ou o número dele quando a consulta falhou: a reserva continua legível. */
function NomesDosRecursos({ ids }: { ids: readonly number[] }) {
  const recursos = useRecursosDaReserva(ids);
  if (recursos.some((r) => r.carregando)) {
    return <span className={estilos.carregando}>Carregando recursos…</span>;
  }
  return <>{recursos.map((r) => r.recurso?.nome ?? `Recurso ${r.id}`).join(', ')}</>;
}

/**
 * Estados em que a ação aparece. É só o que a tela oferece: a recusa por perfil, dono ou horário (RN-07, RN-18, RN-19)
 * vem do servidor, com o código estável, e é mostrada na tela. O front nunca olha o relógio nem o dono.
 */
const ESTADOS_COM_ACOES: ReadonlySet<Reserva['estado']> = new Set(['SOLICITADA', 'APROVADA']);

/** A alteração é parte da T03, que o Administrador não vê (RN-17). Esconder o link é conveniência: o servidor recusa. */
const PERFIS_QUE_ALTERAM = TELAS.find((t) => t.id === 'T03')?.perfis ?? [];

interface Props {
  reserva: Reserva;
  aoCancelada: (reserva: Reserva) => void;
}

/** Uma reserva. Mostra o que o servidor devolveu e as ações que o estado comporta. */
export function CartaoDeReserva({ reserva, aoCancelada }: Props) {
  const idTitulo = useId();
  const { sessao } = useSessao();
  const podeVerAlterar = sessao !== null && PERFIS_QUE_ALTERAM.includes(sessao.perfil);
  const [cancelando, setCancelando] = useState(false);
  const cartao = useRef<HTMLElement>(null);
  const abridor = useRef<HTMLButtonElement>(null);

  const cancelada = (r: Reserva) => {
    setCancelando(false);
    aoCancelada(r);
  };

  return (
    <article ref={cartao} tabIndex={-1} aria-labelledby={idTitulo} className={estilos.cartao}>
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
      {ESTADOS_COM_ACOES.has(reserva.estado) && (
        <div className={estilos.acoes}>
          {podeVerAlterar && (
            <Link to={`/reservas/${reserva.id}/alterar`} className={`${botoes.botao} ${botoes.secundario}`}>
              Alterar <span className="somente-leitor">{reserva.titulo}</span>
            </Link>
          )}
          <Botao ref={abridor} variante="secundario" onClick={() => setCancelando(true)}>
            Cancelar <span className="somente-leitor">{reserva.titulo}</span>
          </Botao>
        </div>
      )}
      {cancelando && (
        <DialogoDeCancelamento
          reserva={reserva}
          aoFechar={() => setCancelando(false)}
          aoCancelada={cancelada}
          retorno={abridor}
          alternativa={cartao}
        />
      )}
    </article>
  );
}
