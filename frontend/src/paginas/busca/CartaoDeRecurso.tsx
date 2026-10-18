import { useId, type ReactNode } from 'react';
import estilos from '@/paginas/busca/CartaoDeRecurso.module.css';
import type { Recurso } from '@/recursos/consulta';
import { descreverDias, ROTULO_DO_TIPO } from '@/recursos/formatacao';

function Detalhe({ nome, children }: { nome: string; children: ReactNode }) {
  return (
    <div className={estilos.detalhe}>
      <dt>{nome}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function CartaoDeRecurso({ recurso }: { recurso: Recurso }) {
  const idTitulo = useId();
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
    </article>
  );
}
