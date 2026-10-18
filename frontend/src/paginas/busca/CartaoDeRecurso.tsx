import { useId, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { HorariosOcupados } from '@/paginas/busca/HorariosOcupados';
import estilos from '@/paginas/busca/CartaoDeRecurso.module.css';
import type { Recurso } from '@/recursos/consulta';
import { descreverDias, ROTULO_DO_TIPO } from '@/recursos/formatacao';
import botoes from '@/ui/Botao.module.css';

export interface PeriodoDaBusca {
  /** Data e hora do campus, como nos campos do formulário ("2026-10-21T14:00"). */
  inicioLocal?: string;
  fimLocal?: string;
  /** Janela para consultar horários ocupados: instantes ISO-8601 com offset. */
  janelaInicio: string;
  janelaFim: string;
}

function Detalhe({ nome, children }: { nome: string; children: ReactNode }) {
  return (
    <div className={estilos.detalhe}>
      <dt>{nome}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function enderecoDaReserva(recurso: Recurso, periodo: PeriodoDaBusca): string {
  const params = new URLSearchParams({ recursos: String(recurso.id) });
  if (periodo.inicioLocal && periodo.fimLocal) {
    params.set('inicio', periodo.inicioLocal);
    params.set('fim', periodo.fimLocal);
  }
  return `/reservas/nova?${params.toString()}`;
}

export function CartaoDeRecurso({ recurso, periodo }: { recurso: Recurso; periodo: PeriodoDaBusca }) {
  const idTitulo = useId();
  const idHorarios = useId();
  const [horariosAbertos, setHorariosAbertos] = useState(false);
  return (
    <article aria-labelledby={idTitulo} className={estilos.cartao}>
      <header className={estilos.cabecalho}>
        <h2 id={idTitulo} className={estilos.nome}>
          {recurso.nome}
        </h2>
        <span className={estilos.tipo}>{ROTULO_DO_TIPO[recurso.tipo]}</span>
      </header>
      <dl className={estilos.detalhes}>
        {recurso.capacidade !== undefined && <Detalhe nome="Capacidade">{recurso.capacidade} pessoas</Detalhe>}
        {recurso.localizacao && <Detalhe nome="Local">{recurso.localizacao}</Detalhe>}
        {recurso.horaAbertura && recurso.horaFechamento && (
          <Detalhe nome="Funcionamento">
            {recurso.horaAbertura} às {recurso.horaFechamento}
            {recurso.diasFuncionamento?.length ? `, ${descreverDias(recurso.diasFuncionamento)}` : ''}
          </Detalhe>
        )}
        {recurso.codigoPatrimonio && <Detalhe nome="Patrimônio">{recurso.codigoPatrimonio}</Detalhe>}
        {recurso.descricao && <Detalhe nome="Descrição">{recurso.descricao}</Detalhe>}
        {recurso.competencias && recurso.competencias.length > 0 && (
          <Detalhe nome="Competências">
            <ul className={estilos.competencias}>
              {recurso.competencias.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Detalhe>
        )}
      </dl>
      {recurso.restrito && <p className={estilos.restrito}>Exige aprovação</p>}
      <div className={estilos.acoes}>
        <Link to={enderecoDaReserva(recurso, periodo)} className={`${botoes.botao} ${botoes.primario}`}>
          Reservar{' '}
          <span className="somente-leitor">{recurso.nome}</span>
        </Link>
        <button
          type="button"
          className={`${botoes.botao} ${botoes.secundario}`}
          aria-expanded={horariosAbertos}
          aria-controls={horariosAbertos ? idHorarios : undefined}
          onClick={() => setHorariosAbertos((aberto) => !aberto)}
        >
          Ver horários ocupados{' '}
          <span className="somente-leitor">de {recurso.nome}</span>
        </button>
      </div>
      {horariosAbertos && (
        <HorariosOcupados
          id={idHorarios}
          recursoId={recurso.id}
          inicio={periodo.janelaInicio}
          fim={periodo.janelaFim}
        />
      )}
    </article>
  );
}
