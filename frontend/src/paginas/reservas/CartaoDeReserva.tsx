import { useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FUSO_DO_CAMPUS, formatarIntervalo } from '@/datas/fuso';
import estilos from '@/paginas/reservas/CartaoDeReserva.module.css';
import { DialogoDeCancelamento } from '@/paginas/reservas/DialogoDeCancelamento';
import { useRecursosDaReserva } from '@/reservas/consulta';
import type { Reserva } from '@/reservas/criar';
import { ROTULO_DO_ESTADO, textoDoMotivo } from '@/reservas/rotulos';
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

/** Estados em que a reserva ainda está em curso: sem ação disponível, a pessoa merece uma explicação (F6-14). */
const ESTADOS_EM_ANDAMENTO: ReadonlySet<Reserva['estado']> = new Set(['SOLICITADA', 'APROVADA', 'EM_USO']);

/** Texto aprovado por Jefferson (19/10/2026). Não explica a regra nem sugere ação: o front não sabe o motivo. */
const MENSAGEM_SEM_ACAO = 'Você não pode alterar nem cancelar esta reserva agora.';

interface Props {
  reserva: Reserva;
  aoCancelada: (reserva: Reserva) => void;
}

/**
 * Uma reserva. Mostra o que o servidor devolveu. As ações aparecem só quando o servidor diz que o usuário pode
 * (podeAlterar e podeCancelar, F6-14): o front não olha estado, perfil, dono nem relógio, e a recusa pelo código
 * estável continua valendo como defesa (ADR-004).
 */
export function CartaoDeReserva({ reserva, aoCancelada }: Props) {
  const idTitulo = useId();
  const idMensagem = useId();
  const semAcao = !reserva.podeAlterar && !reserva.podeCancelar && ESTADOS_EM_ANDAMENTO.has(reserva.estado);
  const [cancelando, setCancelando] = useState(false);
  const cartao = useRef<HTMLElement>(null);
  const abridor = useRef<HTMLButtonElement>(null);

  const cancelada = (r: Reserva) => {
    setCancelando(false);
    aoCancelada(r);
  };

  return (
    <article ref={cartao} tabIndex={-1} aria-labelledby={idTitulo}
      aria-describedby={semAcao ? idMensagem : undefined}
      className={estilos.cartao}
    >
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
      {(reserva.podeAlterar || reserva.podeCancelar) && (
        <div className={estilos.acoes}>
          {reserva.podeAlterar && (
            <Link to={`/reservas/${reserva.id}/alterar`} className={`${botoes.botao} ${botoes.secundario}`}>
              Alterar <span className="somente-leitor">{reserva.titulo}</span>
            </Link>
          )}
          {reserva.podeCancelar && (
            <Botao ref={abridor} variante="secundario" onClick={() => setCancelando(true)}>
              Cancelar <span className="somente-leitor">{reserva.titulo}</span>
            </Botao>
          )}
        </div>
      )}
      {semAcao && (
        <p id={idMensagem} className={estilos.semAcao}>
          {MENSAGEM_SEM_ACAO}
        </p>
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
