package br.senac.recursos.model;

import java.time.Instant;
import java.util.List;

/** Alteração parcial. Campos nulos não mudam. */
public record AlteracaoDeReserva(String titulo, String descricao, Instant inicio, Instant fim, List<Long> recursoIds) {
}
