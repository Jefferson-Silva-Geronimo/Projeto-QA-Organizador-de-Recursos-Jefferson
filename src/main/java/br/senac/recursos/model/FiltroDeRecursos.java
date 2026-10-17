package br.senac.recursos.model;

import java.time.Instant;

/** Filtros da pesquisa. Campos nulos não filtram. O intervalo é semiaberto [inicio, fim). */
public record FiltroDeRecursos(TipoRecurso tipo, Integer capacidadeMinima, String localizacao, String competencia,
              Instant inicio, Instant fim) {
}
