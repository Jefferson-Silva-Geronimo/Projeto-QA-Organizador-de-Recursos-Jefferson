import { useEffect, useRef, useState } from 'react';
import { CartaoDeUso, type ConfirmacaoDeUso } from '@/paginas/retiradas/CartaoDeUso';
import { DialogoDeUso } from '@/paginas/retiradas/DialogoDeUso';
import estilos from '@/paginas/reservas/PaginaDeReservas.module.css';
import { useReservas } from '@/reservas/consulta';
import type { Reserva } from '@/reservas/criar';
import { Aviso } from '@/ui/Aviso';
import { ErroDaApi } from '@/ui/ErroDaApi';
import { Carregando, EstadoVazio } from '@/ui/Estados';

/** A tela é das reservas que aguardam ou estão em uso (T06). O servidor decide a lista, e o front só separa estas. */
const ESTADOS_DO_USO: ReadonlySet<Reserva['estado']> = new Set(['APROVADA', 'EM_USO']);

function contagem(total: number): string {
  return total === 1 ? '1 reserva para o uso' : `${total} reservas para o uso`;
}

interface EmConfirmacao {
  tipo: ConfirmacaoDeUso;
  reserva: Reserva;
}

/**
 * Retirada e devolução (T06, RF-09 e RF-16). Só o Responsável chega aqui (rota por perfil). O diálogo vive na página, e
 * não no cartão, porque a reserva sai da lista quando é concluída ou marcada como não compareceu: a mensagem de uma
 * recusa não pode sumir junto com o cartão.
 */
export function PaginaDeRetiradas() {
  const reservas = useReservas();
  const [confirmacao, setConfirmacao] = useState<EmConfirmacao | null>(null);
  const [resultado, setResultado] = useState<{ texto: string; numero: number } | null>(null);
  const contador = useRef(0);
  const titulo = useRef<HTMLHeadingElement>(null);
  const aviso = useRef<HTMLDivElement>(null);
  const abridor = useRef<HTMLElement | null>(null);

  // O botão que o Responsável usou pode deixar de existir (Retirar vira Devolver): o foco vai para a confirmação.
  useEffect(() => {
    if (resultado) {
      aviso.current?.focus();
    }
  }, [resultado]);

  const anunciar = (texto: string) => {
    contador.current += 1;
    setResultado({ texto, numero: contador.current });
  };

  const confirmar = (tipo: ConfirmacaoDeUso, reserva: Reserva, botao: HTMLButtonElement) => {
    abridor.current = botao;
    setResultado(null);
    setConfirmacao({ tipo, reserva });
  };

  const doUso = reservas.data?.filter((r) => ESTADOS_DO_USO.has(r.estado));

  return (
    <section aria-labelledby="titulo-da-tela" className={estilos.pagina}>
      <h1 id="titulo-da-tela" ref={titulo} tabIndex={-1}>
        Retiradas
      </h1>
      {resultado && (
        <Aviso tipo="sucesso" ref={aviso}>
          {resultado.texto}
        </Aviso>
      )}
      {reservas.isPending && <Carregando texto="Carregando reservas…" />}
      {reservas.isError && <ErroDaApi erro={reservas.error} aoTentarDeNovo={() => void reservas.refetch()} />}
      {doUso && (
        <>
          <p className={estilos.contagem}>{contagem(doUso.length)}</p>
          {doUso.length === 0 ? (
            <EstadoVazio titulo="Nada para registrar">Nenhuma reserva aprovada ou em uso agora.</EstadoVazio>
          ) : (
            <div className={estilos.grade}>
              {doUso.map((reserva) => (
                <CartaoDeUso key={reserva.id} reserva={reserva} aoRegistrado={anunciar} aoConfirmar={confirmar} />
              ))}
            </div>
          )}
        </>
      )}
      {confirmacao && (
        <DialogoDeUso
          tipo={confirmacao.tipo}
          reserva={confirmacao.reserva}
          aoFechar={() => setConfirmacao(null)}
          aoRegistrado={(texto) => {
            anunciar(texto);
            setConfirmacao(null);
          }}
          retorno={abridor}
          alternativa={titulo}
        />
      )}
    </section>
  );
}
