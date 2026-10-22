import { useId } from 'react';
import type { ItemDaFila } from '@/aprovacoes/consulta';
import { FUSO_DO_CAMPUS, formatarIntervalo } from '@/datas/fuso';
import estilos from '@/paginas/reservas/CartaoDeReserva.module.css';
import { useRecursosDaReserva } from '@/reservas/consulta';
import { Botao } from '@/ui/Botao';

/** Nome do recurso, ou o número dele quando a consulta falhou: a solicitação continua legível. */
function NomesDosRecursos({ ids }: { ids: readonly number[] }) {
  const recursos = useRecursosDaReserva(ids);
  if (recursos.some((r) => r.carregando)) {
    return <span className={estilos.carregando}>Carregando recursos…</span>;
  }
  return <>{recursos.map((r) => r.recurso?.nome ?? `Recurso ${r.id}`).join(', ')}</>;
}

/** Texto aprovado por Jefferson (22/10/2026). Não explica a regra nem sugere ação: o front não sabe o motivo. */
const MENSAGEM_SEM_ACAO = 'Você não pode aprovar nem rejeitar esta solicitação agora.';

interface Props {
  item: ItemDaFila;
}

/**
 * Uma solicitação da fila. Mostra o nome de quem pediu, nunca o e-mail (L-04), e o que o servidor devolveu.
 * Aprovar e Rejeitar aparecem só quando o servidor diz que o Responsável pode (podeAprovar e podeRejeitar, F6-15):
 * o front não olha dono, perfil nem relógio, e a recusa pelo código estável continua valendo como defesa (ADR-004).
 * Reaproveita o estilo do cartão de reservas (F6-11).
 */
export function CartaoDaFila({ item }: Props) {
  const idTitulo = useId();
  const idMensagem = useId();
  const semAcao = !item.podeAprovar && !item.podeRejeitar;

  return (
    <article aria-labelledby={idTitulo} aria-describedby={semAcao ? idMensagem : undefined} className={estilos.cartao}>
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
      {!semAcao && (
        <div className={estilos.acoes}>
          {item.podeAprovar && (
            <Botao>
              Aprovar <span className="somente-leitor">{item.titulo}</span>
            </Botao>
          )}
          {item.podeRejeitar && (
            <Botao variante="secundario">
              Rejeitar <span className="somente-leitor">{item.titulo}</span>
            </Botao>
          )}
        </div>
      )}
      {semAcao && (
        <p id={idMensagem} className={estilos.semAcao}>
          {MENSAGEM_SEM_ACAO}
        </p>
      )}
    </article>
  );
}
