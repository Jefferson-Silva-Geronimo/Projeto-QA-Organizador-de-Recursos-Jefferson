import { useFila } from '@/aprovacoes/consulta';
import { CartaoDaFila } from '@/paginas/aprovacoes/CartaoDaFila';
import estilos from '@/paginas/reservas/PaginaDeReservas.module.css';
import { ErroDaApi } from '@/ui/ErroDaApi';
import { Carregando, EstadoVazio } from '@/ui/Estados';

function contagem(total: number): string {
  return total === 1 ? '1 solicitação pendente' : `${total} solicitações pendentes`;
}

/**
 * Fila de aprovações (T05, RF-07). Só o Responsável chega aqui (rota por perfil); o servidor decide a fila e a ordem,
 * e o front a mostra como vem.
 */
export function PaginaDeAprovacoes() {
  const fila = useFila();

  return (
    <section aria-labelledby="titulo-da-tela" className={estilos.pagina}>
      <h1 id="titulo-da-tela">Aprovações</h1>
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
                <CartaoDaFila key={item.id} item={item} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
