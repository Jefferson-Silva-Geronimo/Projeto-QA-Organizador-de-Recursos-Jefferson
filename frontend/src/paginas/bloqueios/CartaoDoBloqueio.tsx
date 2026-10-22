import { useEffect, useId, useRef } from 'react';
import type { Bloqueio } from '@/bloqueios/consulta';
import { useLevantarBloqueio } from '@/bloqueios/consulta';
import { FUSO_DO_CAMPUS, formatarIntervalo } from '@/datas/fuso';
import estilosDoBloqueio from '@/paginas/bloqueios/CartaoDoBloqueio.module.css';
import estilos from '@/paginas/busca/CartaoDeRecurso.module.css';
import { Botao } from '@/ui/Botao';
import { ErroDaApi } from '@/ui/ErroDaApi';

interface Props {
  bloqueio: Bloqueio;
  /** Nome do recurso. Quando o recurso não está mais na lista, a tela mostra o número dele. */
  recurso: string;
  /** Anuncia o resultado de uma mudança. */
  aoAnunciar: (texto: string) => void;
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
 * Um bloqueio da lista (T08, RN-22). Só os ativos oferecem Levantar. Levantar não cancela nem reativa reservas, e dá
 * para criar outro bloqueio depois: por isso não pede confirmação. Quem recusa é o servidor.
 */
export function CartaoDoBloqueio({ bloqueio, recurso, aoAnunciar }: Props) {
  const idTitulo = useId();
  const levantar = useLevantarBloqueio(bloqueio.id);
  const alerta = useRef<HTMLDivElement>(null);

  // Depois de uma recusa o foco vai para a mensagem: o teclado e o leitor de tela vão até ela.
  useEffect(() => {
    if (levantar.isError) {
      alerta.current?.focus();
    }
  }, [levantar.isError, levantar.submittedAt]);

  const confirmar = () => {
    if (levantar.isPending) {
      return;
    }
    levantar.mutate(undefined, { onSuccess: () => aoAnunciar(`Bloqueio de "${recurso}" levantado.`) });
  };

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
      {levantar.isError && <ErroDaApi erro={levantar.error} ref={alerta} />}
      {bloqueio.ativo && (
        <div className={estilos.acoes}>
          <Botao variante="secundario" onClick={confirmar} carregando={levantar.isPending} textoCarregando="Levantando…">
            Levantar <span className="somente-leitor">bloqueio {recurso}</span>
          </Botao>
        </div>
      )}
    </article>
  );
}
