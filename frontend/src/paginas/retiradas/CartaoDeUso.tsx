import { useEffect, useId, useRef } from 'react';
import { FUSO_DO_CAMPUS, formatarHora, formatarIntervalo } from '@/datas/fuso';
import estilosDoUso from '@/paginas/retiradas/CartaoDeUso.module.css';
import estilos from '@/paginas/reservas/CartaoDeReserva.module.css';
import { useRecursosDaReserva } from '@/reservas/consulta';
import type { Reserva } from '@/reservas/criar';
import { useMovimentacoes, type Movimentacao } from '@/reservas/movimentacoes';
import { ROTULO_DO_ESTADO } from '@/reservas/rotulos';
import { useRegistrarUso, type RegistroDeUso } from '@/reservas/uso';
import { Botao } from '@/ui/Botao';
import { ErroDaApi } from '@/ui/ErroDaApi';

/** Texto no padrão aprovado da T04 e da T05: não explica a regra nem sugere ação, porque o front não sabe o motivo. */
const MENSAGEM_SEM_ACAO = 'Você não pode registrar o uso desta reserva agora.';

export type ConfirmacaoDeUso = 'concluir' | 'nao-comparecimento';

interface Props {
  reserva: Reserva;
  /** Anuncia o resultado de uma ação direta. */
  aoRegistrado: (texto: string) => void;
  /** Abre a confirmação de uma ação irreversível. O botão que abriu vai junto, para o foco voltar a ele. */
  aoConfirmar: (tipo: ConfirmacaoDeUso, reserva: Reserva, botao: HTMLButtonElement) => void;
}

function situacaoDaUnidade(atual: Movimentacao | undefined): string {
  if (!atual) {
    return 'Não retirado';
  }
  const quando = `às ${formatarHora(atual.registradoEm, FUSO_DO_CAMPUS)} por ${atual.registradoPorNome}`;
  return atual.tipo === 'RETIRADA' ? `Retirado ${quando}` : `Devolvido ${quando}`;
}

/**
 * Uma reserva aprovada ou em uso. Iniciar, Concluir e Não compareceu aparecem só quando o servidor diz que o
 * Responsável pode (podeIniciar, podeConcluir e podeMarcarNaoComparecimento, F6-16). Retirar e Devolver saem da
 * movimentação marcada como `atual` de cada material: a tela não ordena nem compara sequências. A recusa pelo código
 * estável continua valendo como defesa (ADR-004).
 */
export function CartaoDeUso({ reserva, aoRegistrado, aoConfirmar }: Props) {
  const idTitulo = useId();
  const idMensagem = useId();
  const recursos = useRecursosDaReserva(reserva.recursoIds);
  const movimentacoes = useMovimentacoes(reserva.id);
  const registro = useRegistrarUso(reserva.id);
  const alerta = useRef<HTMLDivElement>(null);

  // Depois de uma recusa o foco vai para a mensagem: o teclado e o leitor de tela vão até ela.
  useEffect(() => {
    if (registro.isError) {
      alerta.current?.focus();
    }
  }, [registro.isError, registro.submittedAt]);

  const carregandoRecursos = recursos.some((r) => r.carregando);
  const materiais = recursos.filter((r) => r.recurso?.tipo === 'MATERIAL');
  const temAcaoDaReserva = reserva.podeIniciar || reserva.podeConcluir || reserva.podeMarcarNaoComparecimento;
  const semAcao = !carregandoRecursos && !temAcaoDaReserva && materiais.length === 0;
  const ocupado = registro.isPending;

  const registrar = (pedido: RegistroDeUso, resultado: string) => {
    if (ocupado) {
      return;
    }
    registro.mutate(pedido, { onSuccess: () => aoRegistrado(resultado) });
  };

  return (
    <article aria-labelledby={idTitulo} aria-describedby={semAcao ? idMensagem : undefined} className={estilos.cartao}>
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
            {carregandoRecursos ? (
              <span className={estilos.carregando}>Carregando recursos…</span>
            ) : (
              recursos.map((r) => r.recurso?.nome ?? `Recurso ${r.id}`).join(', ')
            )}
          </dd>
        </div>
      </dl>
      {materiais.length > 0 && (
        <>
          {movimentacoes.isError && (
            <ErroDaApi erro={movimentacoes.error} aoTentarDeNovo={() => void movimentacoes.refetch()} />
          )}
          <ul className={estilosDoUso.unidades} aria-label="Materiais da reserva">
            {materiais.map(({ id, recurso }) => {
              const atual = movimentacoes.data?.find((m) => m.materialId === id && m.atual);
              const nome = recurso?.nome ?? `Recurso ${id}`;
              return (
                <li key={id} className={estilosDoUso.unidade}>
                  <div className={estilosDoUso.dadosDaUnidade}>
                    <span className={estilosDoUso.nome}>{nome}</span>
                    {movimentacoes.isPending && <span className={estilosDoUso.situacao}>Carregando movimentações…</span>}
                    {movimentacoes.isSuccess && <span className={estilosDoUso.situacao}>{situacaoDaUnidade(atual)}</span>}
                  </div>
                  {movimentacoes.isSuccess &&
                    (atual?.tipo === 'RETIRADA' ? (
                      <Botao
                        variante="secundario"
                        disabled={ocupado}
                        onClick={() => registrar({ acao: 'devolucoes', materialId: id }, `Devolução de "${nome}" registrada.`)}
                      >
                        Devolver <span className="somente-leitor">{nome}</span>
                      </Botao>
                    ) : (
                      <Botao
                        variante="secundario"
                        disabled={ocupado}
                        onClick={() => registrar({ acao: 'retiradas', materialId: id }, `Retirada de "${nome}" registrada.`)}
                      >
                        Retirar <span className="somente-leitor">{nome}</span>
                      </Botao>
                    ))}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {registro.isError && <ErroDaApi erro={registro.error} ref={alerta} />}
      {temAcaoDaReserva && (
        <div className={estilos.acoes}>
          {reserva.podeIniciar && (
            <Botao
              disabled={ocupado}
              onClick={() => registrar({ acao: 'inicio' }, `Uso da reserva "${reserva.titulo}" iniciado.`)}
            >
              Iniciar uso <span className="somente-leitor">{reserva.titulo}</span>
            </Botao>
          )}
          {reserva.podeConcluir && (
            <Botao
              variante="secundario"
              disabled={ocupado}
              onClick={(e) => aoConfirmar('concluir', reserva, e.currentTarget)}
            >
              Concluir reserva <span className="somente-leitor">{reserva.titulo}</span>
            </Botao>
          )}
          {reserva.podeMarcarNaoComparecimento && (
            <Botao
              variante="secundario"
              disabled={ocupado}
              onClick={(e) => aoConfirmar('nao-comparecimento', reserva, e.currentTarget)}
            >
              Não compareceu <span className="somente-leitor">{reserva.titulo}</span>
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
