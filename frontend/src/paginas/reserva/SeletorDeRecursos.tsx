import type { Recurso } from '@/recursos/consulta';
import estilos from '@/paginas/reserva/SeletorDeRecursos.module.css';

const GRUPOS: { tipo: Recurso['tipo']; titulo: string }[] = [
  { tipo: 'SALA', titulo: 'Salas' },
  { tipo: 'PROFESSOR', titulo: 'Professores' },
  { tipo: 'MATERIAL', titulo: 'Materiais' },
];

function resumo(recurso: Recurso): string {
  const partes: string[] = [];
  if (recurso.capacidade !== undefined) partes.push(`${recurso.capacidade} pessoas`);
  if (recurso.localizacao) partes.push(recurso.localizacao);
  if (recurso.codigoPatrimonio) partes.push(recurso.codigoPatrimonio);
  if (recurso.competencias?.length) partes.push(recurso.competencias.join(', '));
  return partes.join(' · ');
}

interface Props {
  recursos: Recurso[];
  marcados: ReadonlySet<number>;
  aoAlternar: (id: number) => void;
  erro?: string;
  idDoErro?: string;
}

/**
 * Recursos livres no período, agrupados por tipo. Só aparece o que o servidor devolveu como livre; o front não
 * decide disponibilidade. "Exige aprovação" vem do dado do recurso, não de uma regra do front.
 */
export function SeletorDeRecursos({ recursos, marcados, aoAlternar, erro, idDoErro }: Props) {
  return (
    <div className={estilos.grupos} aria-describedby={erro ? idDoErro : undefined}>
      {GRUPOS.map(({ tipo, titulo }) => {
        const doGrupo = recursos.filter((r) => r.tipo === tipo);
        if (doGrupo.length === 0) {
          return null;
        }
        return (
          <fieldset key={tipo} className={estilos.grupo}>
            <legend className={estilos.legenda}>{titulo}</legend>
            {doGrupo.map((recurso) => (
              <label key={recurso.id} className={estilos.opcao}>
                <input
                  type="checkbox"
                  checked={marcados.has(recurso.id)}
                  onChange={() => aoAlternar(recurso.id)}
                />
                <span className={estilos.texto}>
                  <span className={estilos.nome}>{recurso.nome}</span>
                  {resumo(recurso) && <span className={estilos.resumo}>{resumo(recurso)}</span>}
                  {recurso.restrito && <span className={estilos.restrito}>Exige aprovação</span>}
                </span>
              </label>
            ))}
          </fieldset>
        );
      })}
    </div>
  );
}
