import type { Tela } from '@/rotas/telas';

/** Marcador de lugar de uma tela. Cada uma é construída, em TDD, no prompt 6.C do plano mestre. */
export function PaginaDeTela({ tela }: { tela: Tela }) {
  return (
    <section aria-labelledby="titulo-da-tela">
      <h1 id="titulo-da-tela">{tela.rotulo}</h1>
      <p>Esta tela será construída na etapa 6.C.</p>
    </section>
  );
}
