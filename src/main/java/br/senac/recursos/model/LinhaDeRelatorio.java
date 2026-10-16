package br.senac.recursos.model;

/** Linha bruta do relatório por recurso, antes do cálculo de utilização (RF-12). */
public record LinhaDeRelatorio(long recursoId, String nome, TipoRecurso tipo, long segundosAlocados,
                               long conflitosEvitados, long solicitantesDistintos) {
}
