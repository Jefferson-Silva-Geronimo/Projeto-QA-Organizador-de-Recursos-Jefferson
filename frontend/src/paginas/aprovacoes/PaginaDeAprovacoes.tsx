import { useEffect, useRef, useState } from 'react';
import { useFila, type ItemDaFila } from '@/aprovacoes/consulta';
import type { TipoDeDecisao } from '@/aprovacoes/decidir';
import { CartaoDaFila } from '@/paginas/aprovacoes/CartaoDaFila';
import { DialogoDeDecisao } from '@/paginas/aprovacoes/DialogoDeDecisao';
import estilos from '@/paginas/reservas/PaginaDeReservas.module.css';
import { Aviso } from '@/ui/Aviso';
import { ErroDaApi } from '@/ui/ErroDaApi';
import { Carregando, EstadoVazio } from '@/ui/Estados';

function contagem(total: number): string {
  return total === 1 ? '1 solicitação pendente' : `${total} solicitações pendentes`;
}

interface EmDecisao {
  tipo: TipoDeDecisao;
  item: ItemDaFila;
}

interface Decidida {
  tipo: TipoDeDecisao;
  titulo: string;
}

/**
 * Fila de aprovações (T05, RF-07). Só o Responsável chega aqui (rota por perfil); o servidor decide a fila, a ordem e o
 * que cada item permite (F6-15), e o front a mostra como vem. O diálogo vive na página, e não no cartão, porque o
 * cartão sai da fila quando outra pessoa decide antes: a mensagem da recusa não pode sumir junto com ele.
 */
export function PaginaDeAprovacoes() {
  const fila = useFila();
  const [decisao, setDecisao] = useState<EmDecisao | null>(null);
  const [decidida, setDecidida] = useState<Decidida | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const aviso = useRef<HTMLDivElement>(null);
  const abridor = useRef<HTMLElement | null>(null);

  // O botão que abriu o diálogo deixa de existir quando o item sai da fila: o foco vai para a confirmação.
  useEffect(() => {
    if (decidida) {
      aviso.current?.focus();
    }
  }, [decidida]);

  const abrir = (tipo: TipoDeDecisao, item: ItemDaFila, botao: HTMLButtonElement) => {
    abridor.current = botao;
    setDecidida(null);
    setDecisao({ tipo, item });
  };

  return (
    <section aria-labelledby="titulo-da-tela" className={estilos.pagina}>
      <h1 id="titulo-da-tela" ref={titulo} tabIndex={-1}>
        Aprovações
      </h1>
      {decidida && (
        <Aviso tipo="sucesso" ref={aviso}>
          Reserva "{decidida.titulo}" {decidida.tipo === 'aprovar' ? 'aprovada' : 'rejeitada'}.
        </Aviso>
      )}
      {fila.isPending && <Carregando texto="Carregando solicitações…" />}
      {fila.isError && <ErroDaApi erro={fila.error} aoTentarDeNovo={() => void fila.refetch()} />}
      {fila.isSuccess && (
        <>
          <p className={estilos.contagem}>{contagem(fila.data.length)}</p>
          {fila.data.length === 0 ? (
            <EstadoVazio titulo="Sem pendências">Nenhuma solicitação aguarda a sua decisão.</EstadoVazio>
          ) : (
            <div className={estilos.grade}>
              {fila.data.map((item) => (
                <CartaoDaFila key={item.id} item={item} aoDecidir={abrir} />
              ))}
            </div>
          )}
        </>
      )}
      {decisao && (
        <DialogoDeDecisao
          tipo={decisao.tipo}
          item={decisao.item}
          aoFechar={() => setDecisao(null)}
          aoDecidida={() => {
            setDecidida({ tipo: decisao.tipo, titulo: decisao.item.titulo });
            setDecisao(null);
          }}
          retorno={abridor}
          alternativa={titulo}
        />
      )}
    </section>
  );
}
