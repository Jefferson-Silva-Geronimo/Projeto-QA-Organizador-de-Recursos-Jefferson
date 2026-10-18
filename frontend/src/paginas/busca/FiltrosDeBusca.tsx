import { useState, type FormEvent } from 'react';
import estilos from '@/paginas/busca/FiltrosDeBusca.module.css';
import { FILTROS_VAZIOS, periodoIncompleto, type RascunhoDosFiltros } from '@/paginas/busca/parametros';
import { Botao } from '@/ui/Botao';
import { Campo } from '@/ui/Campo';

interface Props {
  /** Filtros que estão valendo (os do endereço). Quando mudam de fora, o formulário acompanha. */
  valendo: RascunhoDosFiltros;
  aoBuscar: (filtros: RascunhoDosFiltros) => void;
}

export function FiltrosDeBusca({ valendo, aoBuscar }: Props) {
  const [rascunho, setRascunho] = useState(valendo);
  const [anterior, setAnterior] = useState(valendo);
  const [erros, setErros] = useState<{ inicio?: string; fim?: string }>({});

  // Acompanha mudança vinda de fora (voltar do navegador, limpar) sem perder o foco de quem está digitando.
  if (anterior !== valendo) {
    setAnterior(valendo);
    setRascunho(valendo);
    setErros({});
  }

  const mudar = (campo: keyof RascunhoDosFiltros) => (evento: { target: { value: string } }) =>
    setRascunho((r) => ({ ...r, [campo]: evento.target.value }));

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    const incompleto = periodoIncompleto(rascunho);
    if (incompleto) {
      setErros({ [incompleto.campo]: incompleto.mensagem });
      return;
    }
    setErros({});
    aoBuscar(rascunho);
  };

  const limpar = () => {
    setRascunho(FILTROS_VAZIOS);
    setErros({});
    aoBuscar(FILTROS_VAZIOS);
  };

  return (
    <form role="search" aria-label="Filtros da busca" onSubmit={enviar} className={estilos.formulario} noValidate>
      <Campo rotulo="Tipo">
        {(c) => (
          <select {...c} value={rascunho.tipo} onChange={mudar('tipo')}>
            <option value="">Todos</option>
            <option value="SALA">Sala</option>
            <option value="PROFESSOR">Professor</option>
            <option value="MATERIAL">Material</option>
          </select>
        )}
      </Campo>
      <Campo rotulo="Capacidade mínima">
        {(c) => (
          <input {...c} type="number" min={1} inputMode="numeric" value={rascunho.capacidadeMinima} onChange={mudar('capacidadeMinima')} />
        )}
      </Campo>
      <Campo rotulo="Local">
        {(c) => <input {...c} type="text" value={rascunho.localizacao} onChange={mudar('localizacao')} />}
      </Campo>
      <Campo rotulo="Competência">
        {(c) => <input {...c} type="text" value={rascunho.competencia} onChange={mudar('competencia')} />}
      </Campo>
      <Campo rotulo="Início" erro={erros.inicio}>
        {(c) => <input {...c} type="datetime-local" value={rascunho.inicio} onChange={mudar('inicio')} />}
      </Campo>
      <Campo rotulo="Fim" erro={erros.fim}>
        {(c) => <input {...c} type="datetime-local" value={rascunho.fim} onChange={mudar('fim')} />}
      </Campo>
      <div className={estilos.acoes}>
        <Botao type="submit">Buscar</Botao>
        <Botao variante="secundario" onClick={limpar}>
          Limpar filtros
        </Botao>
      </div>
    </form>
  );
}
