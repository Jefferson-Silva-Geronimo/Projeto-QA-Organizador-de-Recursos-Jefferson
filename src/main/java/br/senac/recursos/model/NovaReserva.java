package br.senac.recursos.model;

import java.util.List;

/** Dados para criar uma reserva. */
public record NovaReserva(String titulo, String descricao, Periodo periodo, List<Long> recursoIds) {
}
