package br.senac.recursos.repository;

import br.senac.recursos.model.LinhaDeRelatorio;
import br.senac.recursos.model.TipoRecurso;
import java.time.Instant;
import java.util.List;

/** Consultas agregadas do relatório de utilização (RF-12). Só leitura. */
public interface RelatorioRepository {

    /**
     * Carga alocada e conflitos evitados por recurso no período [inicio, fim). A carga soma as ocupações de
     * reservas APROVADA, EM_USO e CONCLUÍDA, só na parte interna do período. Lê {@code reservas.estado}
     * e não a coluna {@code ativa}, que é liberada na conclusão.
     */
    List<LinhaDeRelatorio> linhas(Instant inicio, Instant fim, TipoRecurso tipo, Long recursoId,
                                  int limite, int deslocamento);

    long contar(TipoRecurso tipo, Long recursoId);
}
