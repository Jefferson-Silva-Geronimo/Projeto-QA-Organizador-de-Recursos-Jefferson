package br.senac.recursos.model;

/**
 * Resultado do relatório para um recurso (RN-31). {@code utilizacao} só existe para sala: horas alocadas
 * divididas pelas horas de funcionamento nos dias de funcionamento do período.
 */
public record ItemDeRelatorio(long recursoId, String nome, TipoRecurso tipo, double horasAlocadas,
                              Double utilizacao, long conflitosEvitados, long solicitantesDistintos) {
}
