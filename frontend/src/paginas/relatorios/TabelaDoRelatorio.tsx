import estilos from '@/paginas/relatorios/TabelaDoRelatorio.module.css';
import type { ItemDoRelatorio } from '@/relatorios/consulta';
import { ROTULO_DO_TIPO } from '@/recursos/formatacao';

const HORAS = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const PORCENTAGEM = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });

/**
 * Utilização por recurso (RF-12, RN-31). Os números são os que o servidor calculou: o front só os formata. A utilização
 * é só da sala; para professor e material o campo não vem e a tela diz que não se aplica. Tabela compacta no desktop e
 * cartões no celular (F6-07): a mesma tabela, reorganizada pelo CSS.
 */
export function TabelaDoRelatorio({ itens }: { itens: readonly ItemDoRelatorio[] }) {
  return (
    <div className={estilos.envoltorio}>
      <table className={estilos.tabela}>
        <caption className="somente-leitor">Utilização por recurso</caption>
        <thead>
          <tr>
            <th scope="col">Recurso</th>
            <th scope="col">Tipo</th>
            <th scope="col">Horas alocadas</th>
            <th scope="col">Utilização</th>
            <th scope="col">Conflitos evitados</th>
            <th scope="col">Solicitantes distintos</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item) => (
            <tr key={item.recursoId}>
              <th scope="row">{item.nome}</th>
              <td data-rotulo="Tipo">{ROTULO_DO_TIPO[item.tipo]}</td>
              <td data-rotulo="Horas alocadas">{HORAS.format(item.horasAlocadas)} h</td>
              <td data-rotulo="Utilização">{item.utilizacao === undefined ? 'Não se aplica' : PORCENTAGEM.format(item.utilizacao)}</td>
              <td data-rotulo="Conflitos evitados">{item.conflitosEvitados}</td>
              <td data-rotulo="Solicitantes distintos">{item.solicitantesDistintos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
