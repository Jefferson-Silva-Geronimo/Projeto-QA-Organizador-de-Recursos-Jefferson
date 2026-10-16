package br.senac.recursos.model;

/** Ocupação ativa que impede a alocação. {@code manutencao} é verdadeiro se vem de um bloqueio. */
public record OcupacaoConflitante(boolean manutencao) {
}
