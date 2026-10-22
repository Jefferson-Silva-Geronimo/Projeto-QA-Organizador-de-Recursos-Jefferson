import { useEffect, useRef, useState, type FormEvent } from 'react';
import estilos from '@/paginas/relatorios/FiltrosDoRelatorio.module.css';
import { FILTROS_VAZIOS, faltasDoPeriodo, type RascunhoDoRelatorio } from '@/paginas/relatorios/parametros';
import { useRecursos } from '@/recursos/consulta';
import { Botao } from '@/ui/Botao';
import { Campo } from '@/ui/Campo';

interface Props {
  /** Filtros que estão valendo (os do endereço). Quando mudam de fora, o formulário acompanha. */
  valendo: RascunhoDoRelatorio;
  aoGerar: (filtros: RascunhoDoRelatorio) => void;
}

/** Filtros do relatório (RF-12): período obrigatório, tipo e recurso opcionais. */
export function FiltrosDoRelatorio({ valendo, aoGerar }: Props) {
  const [rascunho, setRascunho] = useState(valendo);
  const [anterior, setAnterior] = useState(valendo);
  const [erros, setErros] = useState<{ inicio?: string; fim?: string }>({});
  const formulario = useRef<HTMLFormElement>(null);
  const recursos = useRecursos(rascunho.tipo ? { tipo: rascunho.tipo } : {});

  // Acompanha mudança vinda de fora (voltar do navegador, limpar) sem perder o foco de quem está digitando.
  if (anterior !== valendo) {
    setAnterior(valendo);
    setRascunho(valendo);
    setErros({});
  }

  // Faltou o período: o foco vai para o primeiro campo com problema.
  useEffect(() => {
    if (Object.keys(erros).length > 0) {
      formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [erros]);

  const mudar = (campo: 'inicio' | 'fim') => (evento: { target: { value: string } }) =>
    setRascunho((r) => ({ ...r, [campo]: evento.target.value }));

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    const faltas = faltasDoPeriodo(rascunho);
    setErros(faltas);
    if (Object.keys(faltas).length > 0) {
      return;
    }
    aoGerar({ ...rascunho, pagina: '' });
  };

  const limpar = () => {
    setRascunho(FILTROS_VAZIOS);
    setErros({});
    aoGerar(FILTROS_VAZIOS);
  };

  return (
    <form ref={formulario} role="search" aria-label="Filtros do relatório" onSubmit={enviar} className={estilos.formulario} noValidate>
      <Campo rotulo="Início" obrigatorio erro={erros.inicio}>
        {(c) => <input {...c} type="datetime-local" value={rascunho.inicio} onChange={mudar('inicio')} />}
      </Campo>
      <Campo rotulo="Fim" obrigatorio erro={erros.fim}>
        {(c) => <input {...c} type="datetime-local" value={rascunho.fim} onChange={mudar('fim')} />}
      </Campo>
      <Campo rotulo="Tipo">
        {(c) => (
          <select
            {...c}
            value={rascunho.tipo}
            onChange={(e) => setRascunho((r) => ({ ...r, tipo: e.target.value as RascunhoDoRelatorio['tipo'], recursoId: '' }))}
          >
            <option value="">Todos</option>
            <option value="SALA">Sala</option>
            <option value="PROFESSOR">Professor</option>
            <option value="MATERIAL">Material</option>
          </select>
        )}
      </Campo>
      <Campo rotulo="Recurso">
        {(c) => (
          <select {...c} value={rascunho.recursoId} onChange={(e) => setRascunho((r) => ({ ...r, recursoId: e.target.value }))}>
            <option value="">Todos os recursos</option>
            {(recursos.data ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </select>
        )}
      </Campo>
      <div className={estilos.acoes}>
        <Botao type="submit">Gerar relatório</Botao>
        <Botao variante="secundario" onClick={limpar}>
          Limpar filtros
        </Botao>
      </div>
    </form>
  );
}
