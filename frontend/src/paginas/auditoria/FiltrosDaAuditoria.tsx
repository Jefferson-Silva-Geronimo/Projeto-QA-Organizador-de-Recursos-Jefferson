import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ENTIDADES, FILTROS_VAZIOS, type FiltrosDaAuditoria as Filtros } from '@/paginas/auditoria/parametros';
import { ROTULO_DA_ENTIDADE } from '@/paginas/auditoria/rotulos';
import estilos from '@/paginas/relatorios/FiltrosDoRelatorio.module.css';
import { Botao } from '@/ui/Botao';
import { Campo } from '@/ui/Campo';

interface Props {
  /** O Administrador consulta a auditoria completa; o Responsável, o histórico de uma reserva. */
  administrador: boolean;
  /** Filtros que estão valendo (os do endereço). Quando mudam de fora, o formulário acompanha. */
  valendo: Filtros;
  aoConsultar: (filtros: Filtros) => void;
}

/** Filtros do histórico (T09, RF-10). O período é filtrado na tela, sobre a lista que o servidor devolveu (L-03). */
export function FiltrosDaAuditoria({ administrador, valendo, aoConsultar }: Props) {
  const [rascunho, setRascunho] = useState(valendo);
  const [anterior, setAnterior] = useState(valendo);
  const [erroDaReserva, setErroDaReserva] = useState<string | undefined>();
  const formulario = useRef<HTMLFormElement>(null);

  // Acompanha mudança vinda de fora (voltar do navegador, limpar) sem perder o foco de quem está digitando.
  if (anterior !== valendo) {
    setAnterior(valendo);
    setRascunho(valendo);
    setErroDaReserva(undefined);
  }

  // Faltou o número da reserva: o foco vai para o campo.
  useEffect(() => {
    if (erroDaReserva) {
      formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [erroDaReserva]);

  const mudar = (campo: keyof Filtros) => (evento: { target: { value: string } }) =>
    setRascunho((r) => ({ ...r, [campo]: evento.target.value }));

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    if (!administrador && !rascunho.reserva.trim()) {
      setErroDaReserva('Informe o número da reserva.');
      return;
    }
    setErroDaReserva(undefined);
    aoConsultar(rascunho);
  };

  const limpar = () => {
    setRascunho(FILTROS_VAZIOS);
    setErroDaReserva(undefined);
    aoConsultar(FILTROS_VAZIOS);
  };

  return (
    <form ref={formulario} role="search" aria-label="Filtros do histórico" onSubmit={enviar} className={estilos.formulario} noValidate>
      {administrador ? (
        <>
          <Campo rotulo="Entidade">
            {(c) => (
              <select {...c} value={rascunho.entidade} onChange={mudar('entidade')}>
                <option value="">Todas</option>
                {ENTIDADES.map((e) => (
                  <option key={e} value={e}>
                    {ROTULO_DA_ENTIDADE[e]}
                  </option>
                ))}
              </select>
            )}
          </Campo>
          <Campo rotulo="Número">
            {(c) => <input {...c} type="number" inputMode="numeric" min={1} value={rascunho.numero} onChange={mudar('numero')} />}
          </Campo>
        </>
      ) : (
        <Campo rotulo="Reserva (número)" obrigatorio erro={erroDaReserva}>
          {(c) => <input {...c} type="number" inputMode="numeric" min={1} value={rascunho.reserva} onChange={mudar('reserva')} />}
        </Campo>
      )}
      <Campo rotulo="De">
        {(c) => <input {...c} type="date" value={rascunho.de} onChange={mudar('de')} />}
      </Campo>
      <Campo rotulo="Até">
        {(c) => <input {...c} type="date" value={rascunho.ate} onChange={mudar('ate')} />}
      </Campo>
      <div className={estilos.acoes}>
        <Botao type="submit">Consultar</Botao>
        <Botao variante="secundario" onClick={limpar}>
          Limpar filtros
        </Botao>
      </div>
    </form>
  );
}
