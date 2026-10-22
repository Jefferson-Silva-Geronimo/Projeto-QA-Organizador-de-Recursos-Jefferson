import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react';
import { ErroDeApi } from '@/api/cliente';
import { useLevantarBloqueio } from '@/bloqueios/consulta';
import estilos from '@/paginas/catalogo/DialogoDeCadastro.module.css';
import { Botao } from '@/ui/Botao';
import { Campo } from '@/ui/Campo';
import { Dialogo } from '@/ui/Dialogo';
import { ErroDaApi } from '@/ui/ErroDaApi';

interface Props {
  /** Bloqueio a levantar, com o nome do recurso já resolvido pela página. */
  bloqueio: { id: number; recurso: string };
  aoFechar: () => void;
  aoLevantado: (texto: string) => void;
  retorno: RefObject<HTMLElement | null>;
  alternativa: RefObject<HTMLElement | null>;
}

/**
 * Levantar um bloqueio (T08, RN-22). O servidor exige o motivo, então a tela o pede antes de enviar. Levantar não
 * reativa as reservas que o bloqueio cancelou. Quem recusa é o servidor, pela tabela de erros.
 */
export function DialogoDeLevantamento({ bloqueio, aoFechar, aoLevantado, retorno, alternativa }: Props) {
  const [motivo, setMotivo] = useState('');
  const [local, setLocal] = useState<string | undefined>();
  const [doServidor, setDoServidor] = useState<string | undefined>();
  const levantar = useLevantarBloqueio(bloqueio.id);
  const formulario = useRef<HTMLFormElement>(null);
  const alerta = useRef<HTMLDivElement>(null);

  // Depois de uma recusa o foco vai para a mensagem: o teclado e o leitor de tela vão até ela.
  useEffect(() => {
    if (levantar.isError) {
      alerta.current?.focus();
    }
  }, [levantar.isError, levantar.submittedAt]);

  // Faltou o motivo: o foco vai para o campo.
  useEffect(() => {
    if (local) {
      formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [local]);

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    if (levantar.isPending) {
      return;
    }
    if (!motivo.trim()) {
      setLocal('Informe o motivo.');
      return;
    }
    setLocal(undefined);
    setDoServidor(undefined);
    levantar.mutate(motivo.trim(), {
      onSuccess: () => aoLevantado(`Bloqueio de "${bloqueio.recurso}" levantado.`),
      onError: (e) => {
        if (e instanceof ErroDeApi && e.problema.code === 'MOTIVO_OBRIGATORIO') {
          setDoServidor('Confira este campo.');
        }
      },
    });
  };

  return (
    <Dialogo
      titulo="Levantar este bloqueio?"
      descricao={`O bloqueio de "${bloqueio.recurso}" será levantado. Informe o motivo.`}
      aoFechar={aoFechar}
      ocupado={levantar.isPending}
      retorno={retorno}
      alternativa={alternativa}
    >
      <form ref={formulario} onSubmit={enviar} noValidate className={estilos.formulario}>
        {levantar.isError && <ErroDaApi erro={levantar.error} ref={alerta} />}
        <Campo rotulo="Motivo" obrigatorio erro={local ?? doServidor}>
          {(c) => (
            <input
              {...c}
              type="text"
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                setLocal(undefined);
                setDoServidor(undefined);
              }}
            />
          )}
        </Campo>
        <div className={estilos.acoes}>
          <Botao type="submit" carregando={levantar.isPending} textoCarregando="Levantando…">
            Levantar bloqueio
          </Botao>
          <Botao variante="secundario" onClick={aoFechar} disabled={levantar.isPending}>
            Voltar
          </Botao>
        </div>
      </form>
    </Dialogo>
  );
}
