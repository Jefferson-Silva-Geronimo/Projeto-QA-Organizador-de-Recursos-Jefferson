import { CartaoDeRecurso } from '@/paginas/busca/CartaoDeRecurso';
import estilos from '@/paginas/busca/PaginaDeBusca.module.css';
import { useRecursos } from '@/recursos/consulta';
import { Carregando } from '@/ui/Estados';

function contagem(total: number): string {
  return total === 1 ? '1 recurso encontrado' : `${total} recursos encontrados`;
}

/** Busca de recursos (T02, RF-03). A disponibilidade é decidida pelo servidor. */
export function PaginaDeBusca() {
  const consulta = useRecursos({});
  const recursos = consulta.data ?? [];

  return (
    <section aria-labelledby="titulo-da-tela" className={estilos.pagina}>
      <h1 id="titulo-da-tela">Buscar</h1>
      <p aria-live="polite" className={estilos.contagem}>
        {consulta.isSuccess ? contagem(recursos.length) : ''}
      </p>
      {consulta.isPending && <Carregando texto="Buscando recursos…" />}
      <div className={estilos.grade}>
        {recursos.map((recurso) => (
          <CartaoDeRecurso key={recurso.id} recurso={recurso} />
        ))}
      </div>
    </section>
  );
}
