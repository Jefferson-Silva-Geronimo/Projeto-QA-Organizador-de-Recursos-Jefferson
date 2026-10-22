import { useEffect, useRef, useState } from 'react';
import { useBloqueios } from '@/bloqueios/consulta';
import { CartaoDoBloqueio } from '@/paginas/bloqueios/CartaoDoBloqueio';
import { FormularioDeBloqueio } from '@/paginas/bloqueios/FormularioDeBloqueio';
import estilosDaLista from '@/paginas/reservas/PaginaDeReservas.module.css';
import { useRecursos } from '@/recursos/consulta';
import { Aviso } from '@/ui/Aviso';
import { ErroDaApi } from '@/ui/ErroDaApi';
import { Carregando, EstadoVazio } from '@/ui/Estados';

function contagem(total: number): string {
  return total === 1 ? '1 bloqueio' : `${total} bloqueios`;
}

/**
 * Bloqueios de manutenção (T08, RN-22). Só o Administrador chega aqui (matriz de telas), e o servidor recusa os outros
 * com 403 (ADR-004). A lista traz ativos e levantados, em ordem de início (L-02), e o formulário cria em duas etapas.
 */
export function PaginaDeBloqueios() {
  const bloqueios = useBloqueios();
  const recursos = useRecursos({});
  const [resultado, setResultado] = useState<{ texto: string; numero: number } | null>(null);
  const contador = useRef(0);
  const aviso = useRef<HTMLDivElement>(null);

  // O botão que o Administrador usou pode deixar de existir (o bloqueio passa a Levantado): o foco vai para a confirmação.
  useEffect(() => {
    if (resultado) {
      aviso.current?.focus();
    }
  }, [resultado]);

  const anunciar = (texto: string) => {
    contador.current += 1;
    setResultado({ texto, numero: contador.current });
  };

  const nomes = new Map((recursos.data ?? []).map((r) => [r.id, r.nome]));
  const lista = bloqueios.data;

  return (
    <section aria-labelledby="titulo-da-tela" className={estilosDaLista.pagina}>
      <h1 id="titulo-da-tela">Bloqueios</h1>
      {resultado && (
        <Aviso tipo="sucesso" ref={aviso}>
          {resultado.texto}
        </Aviso>
      )}
      <FormularioDeBloqueio
        recursos={recursos.data ?? []}
        aoCriado={(texto) => {
          setResultado(null);
          anunciar(texto);
        }}
      />
      {bloqueios.isPending && <Carregando texto="Carregando bloqueios…" />}
      {bloqueios.isError && <ErroDaApi erro={bloqueios.error} aoTentarDeNovo={() => void bloqueios.refetch()} />}
      {lista && (
        <>
          <p className={estilosDaLista.contagem}>{contagem(lista.length)}</p>
          {lista.length === 0 ? (
            <EstadoVazio titulo="Nada bloqueado">Nenhum bloqueio registrado.</EstadoVazio>
          ) : (
            <div className={estilosDaLista.grade}>
              {lista.map((bloqueio) => (
                <CartaoDoBloqueio
                  key={bloqueio.id}
                  bloqueio={bloqueio}
                  recurso={nomes.get(bloqueio.recursoId) ?? `Recurso nº ${bloqueio.recursoId}`}
                  aoAnunciar={anunciar}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
